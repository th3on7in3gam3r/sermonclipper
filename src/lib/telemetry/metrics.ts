type RouteMetric = {
  route: string;
  method: string;
  status: number;
  durationMs: number;
  dbQueries: number;
  at: number;
};

type EndpointStats = {
  route: string;
  count: number;
  errorCount: number;
  p95: number;
  avg: number;
};

const MAX_SAMPLES = 2000;
const samples: RouteMetric[] = [];
const circuitStates: Record<string, string> = {};

let queueDepth = 0;

export function recordHttpRequest(input: {
  route: string;
  method: string;
  status: number;
  durationMs: number;
  dbQueries?: number;
}) {
  samples.push({
    ...input,
    dbQueries: input.dbQueries ?? 0,
    at: Date.now(),
  });
  if (samples.length > MAX_SAMPLES) samples.shift();

  if (input.durationMs >= 500) {
    void import('@/lib/telemetry/spans').then(({ captureSlowRoute }) =>
      captureSlowRoute(input.route, input.durationMs, input.status)
    );
  }
  if (input.status >= 500) {
    void import('@/lib/telemetry/spans').then(({ captureServerError }) =>
      captureServerError(input.route, input.status)
    );
  }
}

export function recordCircuitState(name: string, state: string) {
  circuitStates[name] = state;
}

export function setQueueDepth(depth: number) {
  queueDepth = depth;
}

export function incrementDbQueryCount() {
  const ctx = getRequestContext();
  if (ctx) ctx.dbQueries += 1;
}

type RequestContext = { dbQueries: number };
let activeContext: RequestContext | null = null;

export function runWithRequestContext<T>(fn: () => T): T {
  activeContext = { dbQueries: 0 };
  try {
    return fn();
  } finally {
    activeContext = null;
  }
}

export function getRequestDbQueryCount(): number {
  return activeContext?.dbQueries ?? 0;
}

function getRequestContext() {
  return activeContext;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function getMetricsSnapshot(windowMs = 5 * 60_000) {
  const since = Date.now() - windowMs;
  const recent = samples.filter((s) => s.at >= since);
  const byRoute = new Map<string, RouteMetric[]>();

  for (const s of recent) {
    const key = `${s.method} ${s.route}`;
    const list = byRoute.get(key) || [];
    list.push(s);
    byRoute.set(key, list);
  }

  const endpoints: EndpointStats[] = [];
  for (const [key, rows] of byRoute) {
    const durations = rows.map((r) => r.durationMs);
    endpoints.push({
      route: key,
      count: rows.length,
      errorCount: rows.filter((r) => r.status >= 500).length,
      p95: percentile(durations, 95),
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
    });
  }

  endpoints.sort((a, b) => b.p95 - a.p95);

  const total = recent.length;
  const errors = recent.filter((r) => r.status >= 500).length;
  const windowSec = windowMs / 1000;
  const nPlusOne = recent.filter((r) => r.dbQueries > 5).length;

  const mem = process.memoryUsage();
  const heapPct = mem.heapTotal ? (mem.heapUsed / mem.heapTotal) * 100 : 0;

  return {
    windowMs,
    requestRate: total / windowSec,
    errorRate: total ? errors / total : 0,
    errorCount: errors,
    totalRequests: total,
    slowestEndpoints: endpoints.slice(0, 10),
    nPlusOneRequests: nPlusOne,
    queueDepth,
    circuitBreakers: { ...circuitStates },
    memory: {
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      heapPercent: Math.round(heapPct),
      rssMb: Math.round(mem.rss / 1024 / 1024),
    },
    alerts: {
      clipsP95Slow: endpoints.some(
        (e) => e.route.includes('/api/clips') && e.p95 > 500
      ),
      errorRateHigh: total > 20 && errors / total > 0.01,
      queueBacklog: queueDepth > 50,
      memoryHigh: heapPct > 85,
    },
  };
}
