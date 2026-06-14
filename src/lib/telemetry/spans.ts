import * as Sentry from '@sentry/nextjs';

export async function withSpan<T>(
  name: string,
  op: string,
  fn: () => Promise<T>,
  attrs?: Record<string, string | number>
): Promise<T> {
  return Sentry.startSpan({ name, op, attributes: attrs }, fn);
}

export function captureSlowRoute(route: string, durationMs: number, status: number) {
  Sentry.captureMessage(`Slow route: ${route}`, {
    level: 'warning',
    tags: { route, status: String(status) },
    extra: { durationMs },
  });
}

export function captureServerError(route: string, status: number) {
  Sentry.captureMessage(`5xx on ${route}`, {
    level: 'error',
    tags: { route, status: String(status) },
  });
}

export async function traceExternalCall<T>(
  service: 'openai' | 'shotstack' | 'stripe' | 'youtube' | 'social',
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return withSpan(`${service}.${operation}`, 'http.client', fn, { 'peer.service': service });
}

export async function traceDbQuery<T>(kind: 'mongodb' | 'postgres', operation: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await withSpan(`db.${kind}.${operation}`, 'db.query', fn, { 'db.system': kind });
  } finally {
    const ms = performance.now() - start;
    if (ms > 500) {
      Sentry.captureMessage(`Slow ${kind} query`, {
        level: 'warning',
        tags: { 'db.system': kind, operation },
        extra: { durationMs: ms },
      });
    }
    const { incrementDbQueryCount } = await import('@/lib/telemetry/metrics');
    incrementDbQueryCount();
  }
}

export async function traceJob(jobId: string, fn: () => Promise<void>) {
  return withSpan(`job.process`, 'queue.process', fn, { jobId });
}
