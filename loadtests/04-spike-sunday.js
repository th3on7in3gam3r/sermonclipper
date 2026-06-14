import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, spikeThresholds, authHeaders } from './lib/config.js';

export const options = {
  scenarios: {
    sunday_spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 0 },
      ],
    },
  },
  thresholds: spikeThresholds,
};

const routes = ['/', '/api/healthz', '/api/sermons', '/how-it-works'];

export default function () {
  const headers = authHeaders();
  const path = routes[Math.floor(Math.random() * routes.length)];
  const res = http.get(`${BASE_URL}${path}`, { headers, tags: { name: path } });
  check(res, {
    'no 502': (r) => r.status !== 502,
    'no 504': (r) => r.status !== 504,
  });
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(
      {
        p95_ms: data.metrics.http_req_duration?.values?.['p(95)'],
        error_rate: data.metrics.http_req_failed?.values?.rate,
        total_requests: data.metrics.http_reqs?.values?.count,
      },
      null,
      2
    ),
  };
}
