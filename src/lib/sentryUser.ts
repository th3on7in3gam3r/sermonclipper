'use client';

import * as Sentry from '@sentry/nextjs';

export function setSentryUserContext(userId: string, plan?: string) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.setUser({ id: userId });
  Sentry.setTag('plan', plan || 'unknown');
}

export function clearSentryUserContext() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.setUser(null);
}
