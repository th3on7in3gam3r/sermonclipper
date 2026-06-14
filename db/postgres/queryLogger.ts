/**
 * Development-only Postgres query logger.
 * Wrap a pg Pool.query and log statements exceeding SLOW_MS (default 100ms).
 *
 * Usage (after `npm install pg`):
 *   import { Pool } from 'pg';
 *   import { wrapPoolWithQueryLogger } from '@/db/postgres/queryLogger';
 *   const pool = wrapPoolWithQueryLogger(new Pool({ connectionString: process.env.DATABASE_URL }));
 */

const SLOW_MS = Number(process.env.PG_SLOW_QUERY_MS ?? (process.env.NODE_ENV === 'production' ? 500 : 100));
const ENABLED = process.env.NODE_ENV === 'development' || process.env.PG_QUERY_LOG === '1' || process.env.NODE_ENV === 'production';

type QueryablePool = {
  query: (...args: unknown[]) => Promise<unknown>;
};

export function wrapPoolWithQueryLogger<T extends QueryablePool>(pool: T): T {
  if (!ENABLED) return pool;

  const originalQuery = pool.query.bind(pool);

  pool.query = async (...args: unknown[]) => {
    const started = performance.now();
    const text =
      typeof args[0] === 'string'
        ? args[0]
        : typeof args[0] === 'object' && args[0] !== null && 'text' in args[0]
          ? String((args[0] as { text: string }).text)
          : 'unknown';

    try {
      const result = await originalQuery(...args);
      const ms = performance.now() - started;
      if (ms >= SLOW_MS) {
        console.warn(`[PG SLOW ${ms.toFixed(1)}ms] ${truncate(text)}`);
        void import('@/lib/telemetry/spans').then(({ captureSlowRoute }) =>
          captureSlowRoute('postgres.query', ms, 200)
        );
      }
      return result;
    } catch (err) {
      const ms = performance.now() - started;
      console.error(`[PG ERROR ${ms.toFixed(1)}ms] ${truncate(text)}`, err);
      throw err;
    }
  };

  return pool;
}

function truncate(sql: string, max = 240): string {
  const oneLine = sql.replace(/\s+/g, ' ').trim();
  return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max)}…`;
}
