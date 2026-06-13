'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="error-boundary-fallback" style={{ minHeight: '60vh', display: 'grid', placeContent: 'center' }}>
      <h2>Something went wrong</h2>
      <p>We&apos;re on it — our team has been notified. Try again or refresh the page.</p>
      <button type="button" className="vesper-btn vesper-btn-primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
