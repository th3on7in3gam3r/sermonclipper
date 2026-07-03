'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { captureEvent } from '@/lib/analytics';
import { isPaidPlan } from '@/lib/stripePlans';

const plans = [
  {
    name: 'Free',
    bestFor: 'Best for individuals trying Vesper',
    price: '$0',
    desc: 'For individual creators exploring the AI neural engine.',
    features: ['2 Clips / mo', 'Standard Rendering', 'Basic Caption Templates', 'Standard Support'],
    plan: 'free',
    popular: false,
  },
  {
    name: 'Creator',
    bestFor: 'Best for solo pastors or media leads',
    price: '$19',
    desc: 'Power your ministry with consistent cinematic short-form.',
    features: [
      '20 Clips / mo',
      'High-Priority Rendering',
      'All Caption Templates',
      'Custom Branding',
      'Email Support',
    ],
    plan: 'creator',
    popular: true,
  },
  {
    name: 'Church Pro',
    bestFor: 'Best for full ministry teams',
    price: '$49',
    desc: 'The full Vesper suite for growing churches.',
    features: [
      'Unlimited Clips',
      'Ultra-Fast Dedicated Rendering',
      'Multi-User Access',
      'White-Label Branding',
      'Priority Phone Support',
    ],
    plan: 'church_pro',
    popular: false,
  },
  {
    name: 'Network',
    bestFor: 'Denominations & church networks',
    price: 'Custom',
    desc: 'Manage dozens of churches under one network admin dashboard.',
    features: [
      'Child church accounts',
      'Network-wide analytics',
      'Shared brand templates',
      'Dedicated support',
      'Custom billing',
    ],
    plan: 'network',
    popular: false,
    contact: true as const,
  },
] as const;

function getPlanButtonLabel(planId: string, currentPlan: string | null, isSignedIn: boolean): string {
  if (!isSignedIn) return 'Get Started';
  if (planId === currentPlan) return 'Current Plan';
  if (planId === 'creator') return 'Upgrade to Creator';
  if (planId === 'church_pro') return 'Go Pro';
  return 'Get Started';
}

export default function Pricing() {
  const { isLoaded, userId } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setCurrentPlan(null);
      return;
    }
    fetch('/api/user/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCurrentPlan(data?.plan ?? 'free'))
      .catch(() => setCurrentPlan('free'));
  }, [userId]);

  const handleSubscription = async (plan: string) => {
    captureEvent('pricing_plan_clicked', { plan_name: plan });
    setLoading(plan);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const responseText = await res.text();
      let data: { url?: string; error?: string } = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        // responseText is not JSON
      }

      if (res.ok && data.url) {
        window.location.assign(data.url);
      } else {
        throw new Error(data.error || responseText || 'Failed to create checkout session');
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Checkout failed';
      toast.error(msg);
      setLoading(null);
    }
  };

  const handlePlanClick = (planId: string, contact?: boolean) => {
    if (!isLoaded) return;

    if (contact || planId === 'network') {
      window.location.href = 'mailto:hello@vesper.biblefunland.com?subject=Vesper%20Network%20%2F%20Enterprise';
      return;
    }

    if (!userId) {
      if (planId === 'free') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      window.location.href = '/sign-up';
      return;
    }

    if (planId === currentPlan) return;
    if (!isPaidPlan(planId)) return;

    void handleSubscription(planId);
  };

  return (
    <section
      id="pricing"
      className="landing-anchor"
      style={{ padding: '160px 20px', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div className="vesper-badge badge-violet" style={{ marginBottom: '24px' }}>
            Investment
          </div>
          <h2 className="title-xl" style={{ fontSize: 'clamp(32px, 5vw, 64px)', marginBottom: '32px' }}>
            Plans for Every <span className="accent-text">Ministry</span>
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '20px',
              maxWidth: '800px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Empower your church with the tools to reach the next generation.
          </p>
        </div>

        <div className="pricing-grid">
          {plans.map((p) => {
            const isSignedIn = Boolean(userId);
            const isCurrent = isSignedIn && p.plan === currentPlan;
            const label =
              'contact' in p && p.contact
                ? 'Contact us'
                : getPlanButtonLabel(p.plan, currentPlan, isSignedIn);

            return (
              <div
                key={p.plan}
                className={`pricing-card glass-card premium-border animate-in${p.popular ? ' pricing-card--recommended' : ''}`}
              >
                {p.popular && (
                  <div className="pricing-card-badges">
                    <span className="pricing-badge pricing-badge--recommended">Recommended</span>
                    <span className="pricing-badge pricing-badge--popular">Most Popular</span>
                  </div>
                )}

                <h3 className="pricing-card-name">{p.name}</h3>
                <p className="pricing-card-best-for">{p.bestFor}</p>
                <div className="pricing-card-price-row">
                  <span className="title-xl pricing-card-price">{p.price}</span>
                  <span className="pricing-card-period">/mo</span>
                </div>
                <p className="pricing-card-desc">{p.desc}</p>

                <div className="pricing-card-features">
                  {p.features.map((f) => (
                    <div key={f} className="pricing-card-feature">
                      <span className="pricing-card-check">✓</span> {f}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handlePlanClick(
                      p.plan,
                      'contact' in p ? Boolean(p.contact) : false
                    )
                  }
                  disabled={
                    isCurrent ||
                    loading !== null ||
                    (isSignedIn && !isCurrent && !isPaidPlan(p.plan) && !('contact' in p && p.contact))
                  }
                  className={`vesper-btn ${p.popular && !isCurrent ? 'vesper-btn-primary' : 'vesper-btn-outline'} shimmer-effect pricing-card-cta`}
                  style={{
                    opacity:
                      isCurrent || (isSignedIn && !isCurrent && !isPaidPlan(p.plan) && !('contact' in p && p.contact))
                        ? 0.55
                        : 1,
                  }}
                >
                  {loading === p.plan ? 'Redirecting…' : label}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
