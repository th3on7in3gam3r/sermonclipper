import { randomUUID } from 'crypto';

const HEADER = 'x-request-id';

export function generateRequestId(): string {
  return randomUUID();
}

export function getRequestIdFromHeaders(headers: Headers): string {
  return headers.get(HEADER) || headers.get('X-Request-ID') || generateRequestId();
}

export function requestIdHeaderName() {
  return HEADER;
}
