'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

const plans = [
  {
    name: 'Free',
    price: '$0',
    desc: 'For individual creators exploring the AI neural engine.',
    features: ['2 Neural Harvests /mo', 'Standard Rendering', 'Basic Caption Templates', 'Standard Support'],
    priceId: null,
    plan: 'free',
    btn: 'Current Plan'
  },
  {
    name: 'Creator',
    price: '$19',
    desc: 'Power your ministry with consistent cinematic short-form.',
    features: ['20 Neural Harvests /mo', 'High-Priority Rendering', 'All Caption Templates', 'Custom Branding', 'Email Support'],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_CREATOR,
    plan: 'creator',
    btn: 'Upgrade to Creator',
    popular: true
  },
  {
    name: 'Church Pro',
    price: '$49',
    desc: 'The full Vesper suite for growing churches.',
    features: ['Unlimited Harvests', 'Ultra-Fast Dedicated Rendering', 'Multi-User Access', 'White-Label Branding', 'Priority Phone Support'],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_CHURCH_PRO,
    plan: 'church_pro',
    btn: 'Go Pro'
  }
];

export default function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscription = async (priceId: string | null, plan: string) => {
    if (!priceId) return;
    setLoading(plan);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, plan }),
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

  return (
    <section id="pricing" style={{ padding: '160px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div className="vesper-badge badge-violet" style={{ marginBottom: '24px' }}>INVESTMENT</div>
          <h2 className="title-xl" style={{ fontSize: 'clamp(32px, 5vw, 64px)', marginBottom: '32px' }}>
            Plans for Every <span className="accent-text">Ministry</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '20px', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
            Empower your church with the tools to reach the next generation.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', marginTop: '64px', alignItems: 'stretch' }}>
          {plans.map((p) => (
            <div 
              key={p.plan} 
              className={`glass-card premium-border animate-in ${p.popular ? 'popular-plan' : ''}`}
              style={{ 
                padding: '64px 40px', 
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                background: p.popular ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)',
                borderColor: p.popular ? 'rgba(139,92,246,0.3)' : 'var(--card-border)'
              }}
            >
              {p.popular && (
                <div className="vesper-badge badge-violet" style={{ position: 'absolute', top: '24px', right: '24px', padding: '6px 12px', fontSize: '10px' }}>
                  MOST POPULAR
                </div>
              )}
              
              <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '24px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{p.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '24px' }}>
                <span className="title-xl" style={{ fontSize: '56px', lineHeight: 1 }}>{p.price}</span>
                <span style={{ color: 'var(--text-dim)', fontWeight: 800, fontSize: '14px' }}>/MO</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '40px', lineHeight: 1.6, flexShrink: 0 }}>{p.desc}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '64px', flex: 1 }}>
                {p.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#fff', opacity: 0.9 }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 900 }}>✓</span> {f}
                  </div>
                ))}
              </div>
 
              <button 
                onClick={() => handleSubscription(p.priceId as string | null, p.plan)}
                disabled={!p.priceId || loading !== null}
                className={`vesper-btn ${p.popular ? 'vesper-btn-primary' : 'vesper-btn-outline'} shimmer-effect`}
                style={{ 
                  width: '100%', 
                  padding: '16px',
                  opacity: (!p.priceId && p.plan !== 'free') ? 0.5 : 1
                }}
              >
                {loading === p.plan ? 'SECURELY REDIRECTING...' : p.btn}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
