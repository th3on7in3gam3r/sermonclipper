import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  integrations: [
    Sentry.httpIntegration({ spans: true }),
    Sentry.nativeNodeFetchIntegration({ spans: true }),
  ],
  beforeSendTransaction(event) {
    const duration = event.timestamp && event.start_timestamp ? (event.timestamp - event.start_timestamp) * 1000 : 0;
    if (duration > 500 && event.transaction?.includes('/api/clips')) {
      event.tags = { ...event.tags, slow_clips_route: 'true' };
    }
    return event;
  },
});
