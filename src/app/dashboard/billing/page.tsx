'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { vesperClerkAppearance } from '@/lib/clerkAppearance';
import VesperUserButton from '@/components/shared/VesperUserButton';
import SiteFooter from '@/components/layout/SiteFooter';
import CancelSaveFlowModal from '@/components/billing/CancelSaveFlowModal';
import StudioHelpShell from '@/components/help/StudioHelpShell';

type BillingSummary = {
  planLabel: string;
  planPrice: string;
  status: string;
  nextBillingDate: string | null;
  paymentMethod: { last4?: string; exp?: string } | null;
  invoices: { id: string; date: string; amount: string; pdfUrl?: string }[];
  cancelAtPeriodEnd?: boolean;
};

export default function BillingPage() {
  const { isLoaded, userId } = useAuth();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch('/api/billing/summary')
      .then((r) => r.json())
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [userId]);

  const openPortal = async () => {
    const res = await fetch('/api/billing/portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  if (!isLoaded || !userId) {
    return (
      <main style={{ minHeight: '100vh', padding: '120px 24px', textAlign: 'center' }}>
        <p>Sign in to manage billing.</p>
        <Link href="/sign-in">Sign in</Link>
      </main>
    );
  }

  return (
    <StudioHelpShell>
    <main className="vesper-mesh-bg-container" style={{ minHeight: '100vh' }}>
      <div className="vesper-mesh-bg" />
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '120px 24px 80px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Link
          href="/dashboard"
          style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}
        >
          ← Back to Studio
        </Link>
        <h1 style={{ fontSize: '36px', fontWeight: 900, margin: '16px 0 8px' }}>Billing</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
          Manage your plan, payment method, and invoices via Stripe.
        </p>

        {loading ? (
          <p>Loading billing…</p>
        ) : summary ? (
          <div className="glass-card premium-border" style={{ padding: '28px' }}>
            <div style={{ marginBottom: '24px' }}>
              <span className="vesper-badge badge-violet">CURRENT PLAN</span>
              <h2 style={{ fontSize: '24px', fontWeight: 900, marginTop: '12px' }}>
                {summary.planLabel} · {summary.planPrice}
              </h2>
              {summary.nextBillingDate && (
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                  Next billing date: {summary.nextBillingDate}
                </p>
              )}
              {summary.cancelAtPeriodEnd && (
                <p style={{ color: '#F59E0B', marginTop: '8px', fontWeight: 700 }}>
                  Subscription ends at the close of your billing period. You will move to Free afterward.
                </p>
              )}
            </div>

            <button
              type="button"
              className="vesper-btn vesper-btn-primary shimmer-effect"
              onClick={openPortal}
              style={{ width: '100%', marginBottom: '12px' }}
            >
              Upgrade or change plan
            </button>

            {summary.paymentMethod?.last4 && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  marginBottom: '16px',
                }}
              >
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Payment method
                </p>
                <p style={{ fontWeight: 800 }}>
                  Card ending in {summary.paymentMethod.last4} · exp {summary.paymentMethod.exp}
                </p>
                <button
                  type="button"
                  className="vesper-btn-outline"
                  style={{ marginTop: '12px' }}
                  onClick={openPortal}
                >
                  Update card
                </button>
              </div>
            )}

            <h3 style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '12px' }}>
              INVOICE HISTORY
            </h3>
            {summary.invoices.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No invoices yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {summary.invoices.map((inv) => (
                  <li
                    key={inv.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <span>
                      {inv.date} · {inv.amount}
                    </span>
                    {inv.pdfUrl && (
                      <a
                        href={inv.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="vesper-btn-outline"
                        style={{ padding: '6px 12px', fontSize: '11px', textDecoration: 'none' }}
                      >
                        PDF
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              style={{
                marginTop: '32px',
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Cancel subscription
            </button>
          </div>
        ) : null}
      </div>

      {showCancelModal && (
        <CancelSaveFlowModal onClose={() => setShowCancelModal(false)} onOpenStripePortal={openPortal} />
      )}

      <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 10 }}>
        <VesperUserButton appearance={vesperClerkAppearance} />
      </div>
      <SiteFooter />
    </main>
    </StudioHelpShell>
  );
}
