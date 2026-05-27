'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { vesperClerkAppearance } from '@/lib/clerkAppearance';

interface DashboardAccountPanelProps {
  userData: {
    plan?: string;
    usageCount?: number;
    limit?: number;
  } | null;
}

export default function DashboardAccountPanel({ userData }: DashboardAccountPanelProps) {
  const { user, isLoaded } = useUser();

  const planLabel = userData?.plan?.replace(/_/g, ' ').toUpperCase() || 'FREE';
  const usage = userData?.usageCount ?? 0;
  const limit = userData?.limit === 999999 ? '∞' : String(userData?.limit ?? '—');
  const displayName =
    user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Ministry User';
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <section
      className="glass-card premium-border animate-in"
      style={{
        padding: '28px 32px',
        marginBottom: '48px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '24px',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: '1 1 280px' }}>
        {isLoaded && user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt=""
            width={64}
            height={64}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              objectFit: 'cover',
              border: '2px solid rgba(139, 92, 246, 0.4)',
              boxShadow: '0 0 24px rgba(139, 92, 246, 0.25)',
            }}
          />
        ) : (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          />
        )}
        <div>
          <div className="vesper-badge badge-violet" style={{ marginBottom: '10px' }}>
            ACCOUNT
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '4px', letterSpacing: '-0.02em' }}>
            {isLoaded ? displayName : 'Loading…'}
          </h2>
          {email && (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>{email}</p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '12px 20px',
            borderRadius: '14px',
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            minWidth: '140px',
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.15em' }}>
            PLAN
          </span>
          <span style={{ fontSize: '16px', fontWeight: 900 }}>{planLabel}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>
            {usage} / {limit} harvests
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'stretch' }}>
          <UserButton
            showName
            userProfileMode="modal"
            appearance={vesperClerkAppearance}
            userProfileProps={{ appearance: vesperClerkAppearance }}
          />
          <Link
            href="/#pricing"
            className="vesper-btn-outline"
            style={{
              padding: '10px 16px',
              fontSize: '11px',
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            UPGRADE PLAN
          </Link>
        </div>
      </div>

      <p style={{ width: '100%', margin: 0, fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.5 }}>
        Open your avatar menu and choose <strong style={{ color: 'var(--text-muted)' }}>Manage account</strong> to
        update profile, security, and connected accounts — all in a Vesper-styled modal.
      </p>
    </section>
  );
}
