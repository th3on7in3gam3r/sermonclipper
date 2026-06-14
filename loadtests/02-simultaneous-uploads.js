import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, apiThresholds, authHeaders } from './lib/config.js';

export const options = {
  scenarios: {
    simultaneous_uploads: {
      executor: 'constant-vus',
      vus: 20,
      duration: '5m',
    },
  },
  thresholds: {
    ...apiThresholds,
    'http_req_failed': ['rate<0.05'],
  },
};

/** Requires CLERK_SESSION_COOKIE on staging. Uses presigned upload flow (metadata only in load test). */
export default function () {
  const headers = { ...authHeaders(), 'Content-Type': 'application/json' };

  if (!__ENV.CLERK_SESSION_COOKIE) {
    const health = http.get(`${BASE_URL}/api/healthz`);
    check(health, { 'healthz ok': (r) => r.status === 200 || r.status === 503 });
    sleep(5);
    return;
  }

  const jobId = `load-${__VU}-${Date.now()}`;
  const presign = http.post(
    `${BASE_URL}/api/upload-url`,
    JSON.stringify({
      fileName: 'loadtest.mp4',
      contentType: 'video/mp4',
      jobId,
      fileSizeBytes: 52_428_800,
    }),
    { headers, tags: { name: 'upload_url' } }
  );

  check(presign, {
    'presign 200': (r) => r.status === 200,
    'has upload url': (r) => {
      try {
        return !!JSON.parse(r.body).uploadUrl;
      } catch {
        return false;
      }
    },
  });

  for (let i = 0; i < 6; i++) {
    const status = http.get(`${BASE_URL}/api/jobs/${jobId}`, {
      headers,
      tags: { name: 'job_status' },
    });
    check(status, { 'poll ok': (r) => r.status === 200 || r.status === 404 });

    const health = http.get(`${BASE_URL}/api/healthz`, { tags: { name: 'healthz' } });
    if (health.status === 200 || health.status === 503) {
      try {
        const body = JSON.parse(health.body);
        check(body, { 'queue under 50': (b) => (b.queueDepth ?? 0) < 50 });
      } catch {
        /* ignore */
      }
    }
    sleep(5);
  }
}
