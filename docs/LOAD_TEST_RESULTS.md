# Load test results (staging)

**Date:** _YYYY-MM-DD_  
**Environment:** _staging URL_  
**k6 version:** _k6 version_

## Summary

| Scenario | VUs | p95 (ms) | Error rate | Pass? |
|----------|-----|----------|------------|-------|
| Landing browse | 100 | | | |
| Simultaneous uploads | 20 | | | |
| Studio library | 50 | | | |
| Sunday spike | 200 peak | | | |

## Maximum throughput

- Requests/sec before first errors: _
- First endpoint to degrade: _
- Queue depth peak: _

## Memory (spike test)

- Baseline RSS (MB): _
- Peak RSS (MB): _
- Post-ramp-down RSS (MB): _
- Leak observed: yes / no

## Infrastructure recommendations

- [ ] Increase PgBouncer pool / Neon pool size
- [ ] Add worker instances for `/api/jobs/process`
- [ ] Raise Mongo connection pool
- [ ] CDN / edge caching for landing
- [ ] Other: _

## Notes

_Raw k6 output paths, links to Sentry performance traces, etc._
