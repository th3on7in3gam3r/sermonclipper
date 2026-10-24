'use client';

import Link from 'next/link';
import { SignInButton } from '@clerk/nextjs';
import { vesperClerkAppearance } from '@/lib/clerkAppearance';
import VesperUserButton from '@/components/shared/VesperUserButton';
import QuotaDisplay from '@/components/dashboard/QuotaDisplay';
import type { ResultsUserStatus } from '@/lib/results/types';

type Props = {
  isMobile: boolean;
  signedIn: boolean;
  userStatus: ResultsUserStatus | null;
  onOpenTour: () => void;
};

function NavLink({ href, label, isMobile }: { href: string; label: string; isMobile: boolean }) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: 'none',
        fontSize: isMobile ? 13 : 15,
        fontWeight: 500,
        color: 'var(--text-muted)',
        transition: 'color 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
    >
      {label}
    </Link>
  );
}

export default function ResultsHeader({ isMobile, signedIn, userStatus, onOpenTour }: Props) {
  return (
    <header
      className="results-header"
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 24px)',
        maxWidth: 1400,
        minHeight: 64,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isMobile ? '10px 12px' : '0 32px',
        zIndex: 1000,
        borderRadius: 20,
      }}
    >
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/vesper-logo-icon.png" alt="Vesper Studio logo" width={31} height={32} style={{ height: 32, width: 'auto' }} />
        <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-main)' }}>Vesper</span>
      </Link>
      <div style={{ display: 'flex', gap: isMobile ? 12 : 32, alignItems: 'center' }}>
        {signedIn ? (
          <>
            <nav style={{ display: 'flex', gap: isMobile ? 12 : 24 }}>
              <NavLink href="/" label="Home" isMobile={isMobile} />
              <NavLink href="/dashboard" label="Your sermons" isMobile={isMobile} />
            </nav>
            <button
              type="button"
              onClick={onOpenTour}
              title="Open tutorial"
              aria-label="Open tutorial"
              className="vesper-btn-outline"
              style={{ width: 36, height: 36, borderRadius: '50%', padding: 0, fontSize: 16, fontWeight: 900 }}
            >
              ?
            </button>
            <VesperUserButton appearance={vesperClerkAppearance} userProfileProps={{ appearance: vesperClerkAppearance }} />
            {!isMobile && userStatus && (
              <QuotaDisplay
                compact
                usageCount={userStatus.usageCount}
                limit={userStatus.limit}
                lastUsageReset={userStatus.lastUsageReset}
              />
            )}
          </>
        ) : (
          <SignInButton mode="modal" appearance={vesperClerkAppearance}>
            <button
              type="button"
              className="vesper-btn vesper-btn-primary shimmer-effect"
              style={{ padding: isMobile ? '8px 14px' : '10px 24px', fontSize: isMobile ? 11 : 14 }}
            >
              Sign in
            </button>
          </SignInButton>
        )}
      </div>
    </header>
  );
}
