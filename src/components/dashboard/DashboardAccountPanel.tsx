'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

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
        padding: '24px',
        marginBottom: '48px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
        {isLoaded && user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt=""
            width={56}
            height={56}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              objectFit: 'cover',
              border: '2px solid rgba(139, 92, 246, 0.4)',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ minWidth: 0 }}>
          <div className="vesper-badge badge-violet" style={{ marginBottom: '8px' }}>
            ACCOUNT
          </div>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 900,
              marginBottom: '4px',
              letterSpacing: '-0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {isLoaded ? displayName : 'Loading…'}
          </h2>
          {email && (
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {email}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'stretch' }}>
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '14px',
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.15em', display: 'block' }}>
            PLAN
          </span>
          <span style={{ fontSize: '15px', fontWeight: 900, display: 'block', marginTop: '4px' }}>{planLabel}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>
            {usage} / {limit} harvests
          </span>
        </div>
        <Link
          href="/#pricing"
          className="vesper-btn-outline"
          style={{
            padding: '10px 16px',
            fontSize: '11px',
            textAlign: 'center',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          UPGRADE PLAN
        </Link>
      </div>
    </section>
  );
}
