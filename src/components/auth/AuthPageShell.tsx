import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page">
      <div className="auth-page-bg" aria-hidden="true" />
      <div className="auth-page-inner">
        <Link href="/" className="auth-page-brand">
          <img src="/vesper-logo-icon.png" alt="Vesper Studio logo" className="auth-page-logo" />
          <span className="auth-page-wordmark">
            <span className="auth-page-wordmark-accent">VES</span>PER
          </span>
        </Link>
        <div className="auth-page-card">{children}</div>
        <p className="auth-page-footnote">
          By continuing, you agree to our{' '}
          <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
