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

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error: any) {
      toast.error(error.message);
      setLoading(null);
    }
  };

  return (
    <section id="pricing" style={{ padding: '120px 20px', background: 'rgba(139, 92, 246, 0.02)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <span className="section-subtitle">Investment</span>
        <h2 className="section-title">Plans for Every Ministry</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginTop: '64px' }}>
          {plans.map((p) => (
            <div 
              key={p.plan} 
              className="glass-panel" 
              style={{ 
                padding: '48px 32px', 
                position: 'relative', 
                border: p.popular ? '1px solid #8B5CF6' : '1px solid rgba(255,255,255,0.05)',
                transform: p.popular ? 'scale(1.05)' : 'none',
                zIndex: p.popular ? 10 : 1
              }}
            >
              {p.popular && (
                <div style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', background: '#8B5CF6', padding: '4px 16px', borderRadius: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Most Popular
                </div>
              )}
              
              <h3 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>{p.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '20px' }}>
                <span style={{ fontSize: '48px', fontWeight: 900 }}>{p.price}</span>
                <span style={{ color: '#52525B', fontWeight: 600 }}>/mo</span>
              </div>
              <p style={{ color: '#A1A1AA', fontSize: '14px', marginBottom: '32px', lineHeight: 1.6 }}>{p.desc}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px' }}>
                {p.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#D4D4D8' }}>
                    <span style={{ color: '#8B5CF6' }}>✓</span> {f}
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handleSubscription(p.priceId as string | null, p.plan)}
                disabled={!p.priceId || loading !== null}
                className={p.popular ? "primary-btn" : ""}
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  fontWeight: 800, 
                  cursor: p.priceId ? 'pointer' : 'default',
                  background: p.popular ? '#8B5CF6' : 'rgba(255,255,255,0.05)',
                  border: p.popular ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  color: p.priceId ? '#fff' : '#52525B',
                  transition: 'all 0.3s'
                }}
              >
                {loading === p.plan ? 'Redirecting...' : p.btn}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
