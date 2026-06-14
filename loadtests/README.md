# Vesper load tests (k6)

Run against **staging only** — never production.

## Prerequisites

```bash
brew install k6
```

## Environment

```bash
export BASE_URL=https://staging.vesper.app
export CLERK_SESSION_COOKIE=""   # optional — scenarios 2–3
export API_KEY=""                # optional — v1 API checks
```

## Scenarios

| Script | Users | Goal |
|--------|-------|------|
| `01-landing-browse.js` | 100 concurrent | p95 < 300ms, 0% errors |
| `02-simultaneous-uploads.js` | 20 concurrent | uploads succeed, queue < 50 |
| `03-studio-library.js` | 50 concurrent | library p95 < 500ms |
| `04-spike-sunday.js` | 0→200→0 | error rate < 1%, memory stable |

```bash
npm run test:load              # all scenarios
npm run test:load:landing      # scenario 1 only
```

## Recording results

After each run, fill in `docs/LOAD_TEST_RESULTS.md` with:

- Max throughput before errors
- First endpoint to degrade
- p95 / error rate per scenario
- Infrastructure changes needed before launch

## Sentry / Grafana alerts (configure in UI)

- p95 `GET /api/clips` > 500ms
- 5xx rate > 1% on any route
- Job queue depth > 50 (`/api/healthz` → `queueDepth`)
- Memory heap > 85% of limit

Trace correlation: every API response includes `X-Request-ID` (same value as `x-trace-id`).
