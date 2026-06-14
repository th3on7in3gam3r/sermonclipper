import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { wrapPoolWithQueryLogger } from '../../db/postgres/queryLogger';
import { postgresCircuit } from '@/lib/circuitBreaker';
import { traceDbQuery } from '@/lib/telemetry/spans';

const globalForPg = global as typeof globalThis & { pgPool?: Pool };

const poolMax = process.env.NODE_ENV === 'production' ? 20 : 5;

export function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Use Neon/Supabase pooler URL or PgBouncer.');
  }

  if (!globalForPg.pgPool) {
    globalForPg.pgPool = wrapPoolWithQueryLogger(
      new Pool({
        connectionString: url,
        max: poolMax,
        connectionTimeoutMillis: 3000,
        idleTimeoutMillis: 10_000,
        ssl: url.includes('neon.tech') || url.includes('supabase') ? { rejectUnauthorized: true } : undefined,
      })
    );
  }

  return globalForPg.pgPool!;
}

export async function closePool() {
  if (globalForPg.pgPool) {
    await globalForPg.pgPool.end();
    globalForPg.pgPool = undefined;
  }
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  if (postgresCircuit.isOpen()) {
    const err = new Error('Database temporarily unavailable');
    (err as Error & { statusCode?: number }).statusCode = 503;
    throw err;
  }

  try {
    const rows = await traceDbQuery('postgres', 'query', async () => {
      const pool = getPool();
      const result = await pool.query<T>(text, params);
      return result.rows;
    });
    postgresCircuit.recordSuccess();
    return rows;
  } catch (err) {
    postgresCircuit.recordFailure();
    throw err;
  }
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function pingPostgres(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

/** Run multiple statements in a transaction. */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  if (postgresCircuit.isOpen()) {
    const err = new Error('Database temporarily unavailable');
    (err as Error & { statusCode?: number }).statusCode = 503;
    throw err;
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    postgresCircuit.recordSuccess();
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    postgresCircuit.recordFailure();
    throw err;
  } finally {
    client.release();
  }
}
