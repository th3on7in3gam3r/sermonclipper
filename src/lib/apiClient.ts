import toast from 'react-hot-toast';
import { RATE_LIMIT_MESSAGE } from '@/lib/rateLimit';

/** Fetch wrapper that surfaces HTTP 429 with a friendly toast. */
export async function vesperFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After');
    const msg = retryAfter ? `${RATE_LIMIT_MESSAGE} Try again in ${retryAfter} seconds.` : RATE_LIMIT_MESSAGE;
    toast.error(msg, { duration: 5000 });
  }
  return res;
}
