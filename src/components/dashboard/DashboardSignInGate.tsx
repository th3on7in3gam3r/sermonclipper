'use client';

import { SignInButton, SignUpButton } from '@clerk/nextjs';
import Link from 'next/link';
import { vesperClerkAppearance } from '@/lib/clerkAppearance';

export default function DashboardSignInGate() {
  return (
    <main className="vesper-mesh-bg-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="vesper-mesh-bg" />

      <header
        className="glass-card"
        style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '1400px',
          height: '72px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 32px',
          zIndex: 1000,
          borderRadius: '20px',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/vesper-logo-icon.png" alt="VESPER" style={{ height: '32px', width: 'auto' }} />
          <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '0.15em', color: '#fff' }}>
            <span style={{ color: '#8B5CF6' }}>VES</span>PER
          </div>
        </Link>
        <Link href="/" className="vesper-btn-outline" style={{ fontSize: '13px', textDecoration: 'none' }}>
          BACK HOME
        </Link>
      </header>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 24px 80px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          className="glass-card premium-border animate-in"
          style={{
            width: '100%',
            maxWidth: '480px',
            padding: '48px 40px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>🔐</div>
          <div className="vesper-badge badge-violet" style={{ marginBottom: '20px' }}>
            SECURE ACCESS
          </div>
          <h1 className="title-xl gradient-text" style={{ fontSize: '32px', marginBottom: '16px' }}>
            YOUR <span className="accent-text">ARCHIVE</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1.6, marginBottom: '36px' }}>
            Sign in to view harvested sermons, usage limits, and account settings. Authentication opens in a secure
            Clerk modal — no redirect away from Vesper.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <SignInButton mode="modal" appearance={vesperClerkAppearance}>
              <button type="button" className="vesper-btn vesper-btn-primary shimmer-effect" style={{ width: '100%', padding: '16px' }}>
                SIGN IN
              </button>
            </SignInButton>
            <SignUpButton mode="modal" appearance={vesperClerkAppearance}>
              <button type="button" className="vesper-btn-outline" style={{ width: '100%', padding: '16px' }}>
                CREATE ACCOUNT
              </button>
            </SignUpButton>
          </div>
        </div>
      </div>
    </main>
  );
}
