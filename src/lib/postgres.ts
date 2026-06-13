import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { wrapPoolWithQueryLogger } from '../../db/postgres/queryLogger';

const globalForPg = global as typeof globalThis & { pgPool?: Pool };

export function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Add your Neon connection string to .env.local');
  }

  if (!globalForPg.pgPool) {
    globalForPg.pgPool = wrapPoolWithQueryLogger(
      new Pool({
        connectionString: url,
        max: 10,
        ssl: url.includes('neon.tech') ? { rejectUnauthorized: true } : undefined,
      })
    );
  }

  return globalForPg.pgPool!;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Run multiple statements in a transaction. */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
