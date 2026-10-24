'use client';

import type { PostHog } from 'posthog-js';
import { hasAnalyticsConsent } from '@/lib/consent';

/**
 * PostHog is ~150 KB of JS. It is only ever used after the visitor grants
 * analytics consent, so it's loaded on demand instead of shipping in every
 * page's initial bundle. Calls made while it loads are queued and replayed.
 */

type QueuedCall = (ph: PostHog) => void;

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;
const queue: QueuedCall[] = [];

function canTrack() {
  return (
    typeof window !== 'undefined' &&
    Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY) &&
    hasAnalyticsConsent()
  );
}

function load(): Promise<PostHog | null> {
  if (client) return Promise.resolve(client);
  if (loading) return loading;

  loading = import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        capture_pageview: false,
        persistence: 'localStorage',
      });
      client = posthog;
      for (const call of queue.splice(0)) call(posthog);
      return posthog;
    })
    .catch(() => {
      // Ad blockers commonly block the analytics chunk — fail silently and allow a retry later.
      loading = null;
      queue.length = 0;
      return null;
    });

  return loading;
}

function withClient(call: QueuedCall) {
  if (!canTrack()) return;
  if (client) {
    call(client);
    return;
  }
  queue.push(call);
  void load();
}

export function initAnalytics() {
  if (!canTrack()) return;
  void load();
}

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  withClient((ph) => ph.capture(event, properties));
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  withClient((ph) => ph.identify(userId, traits));
}
