/** Shared thresholds and helpers for Vesper k6 load tests. */
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const landingThresholds = {
  http_req_duration: ['p(95)<300'],
  http_req_failed: ['rate==0'],
};

export const apiThresholds = {
  http_req_duration: ['p(95)<500'],
  http_req_failed: ['rate<0.01'],
};

export const spikeThresholds = {
  http_req_failed: ['rate<0.01'],
};

export function authHeaders() {
  const cookie = __ENV.CLERK_SESSION_COOKIE;
  const apiKey = __ENV.API_KEY;
  const headers = { Accept: 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
  return headers;
}

export function checkRequestId(res) {
  const id = res.headers['X-Request-Id'] || res.headers['X-Request-ID'];
  return id && id.length > 8;
}
