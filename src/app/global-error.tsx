'use client';

import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error);
  }

  return (
    <html lang="en">
      <body style={{ background: '#0A0A0F', color: '#fff', fontFamily: 'system-ui', padding: 48 }}>
        <div className="error-boundary-fallback">
          <h2>Something went wrong</h2>
          <p>We&apos;re on it — our team has been notified.</p>
          <button type="button" className="vesper-btn vesper-btn-primary" onClick={reset}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
