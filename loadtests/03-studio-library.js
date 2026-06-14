import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, apiThresholds, authHeaders } from './lib/config.js';

export const options = {
  scenarios: {
    studio_library: {
      executor: 'constant-vus',
      vus: 50,
      duration: '3m',
    },
  },
  thresholds: {
    'http_req_duration{name:sermons_list}': ['p(95)<500'],
    http_req_failed: ['rate<0.02'],
  },
};

export default function () {
  const headers = authHeaders();

  const list = http.get(`${BASE_URL}/api/sermons`, {
    headers,
    tags: { name: 'sermons_list' },
  });
  check(list, {
    'library loads': (r) => r.status === 200 || r.status === 401,
  });

  let jobId = null;
  try {
    const sermons = JSON.parse(list.body);
    if (Array.isArray(sermons) && sermons[0]?.jobId) jobId = sermons[0].jobId;
  } catch {
    /* empty */
  }

  if (jobId) {
    const detail = http.get(`${BASE_URL}/api/sermons?jobId=${jobId}`, {
      headers,
      tags: { name: 'sermon_detail' },
    });
    check(detail, { 'detail ok': (r) => r.status === 200 });

    const clips = http.get(`${BASE_URL}/api/clips?jobId=${jobId}`, {
      headers,
      tags: { name: 'clips' },
    });
    check(clips, { 'clips ok': (r) => r.status === 200 });
  }

  const exportReq = http.get(`${BASE_URL}/api/export?format=mp4`, {
    headers,
    tags: { name: 'export' },
  });
  check(exportReq, {
    'export reachable': (r) => r.status >= 200 && r.status < 500,
  });

  sleep(1);
}
