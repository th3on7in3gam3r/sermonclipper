import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, landingThresholds, checkRequestId } from './lib/config.js';

export const options = {
  scenarios: {
    landing_browse: {
      executor: 'constant-vus',
      vus: 100,
      duration: '2m',
    },
  },
  thresholds: landingThresholds,
};

export default function () {
  const pages = ['/', '/how-it-works', '/for-churches', '/#pricing'];

  for (const path of pages) {
    const res = http.get(`${BASE_URL}${path}`, { tags: { name: path } });
    check(res, {
      'status is 200': (r) => r.status === 200,
      'has request id': checkRequestId,
    });
    sleep(0.5);
  }

  const cta = http.get(`${BASE_URL}/sign-up`, { tags: { name: 'get_started' } });
  check(cta, { 'get started reachable': (r) => r.status >= 200 && r.status < 400 });
  sleep(1);
}
