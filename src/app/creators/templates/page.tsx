'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import LandingNav from '@/components/home/LandingNav';
import SiteFooter from '@/components/layout/SiteFooter';

export default function CreatorsTemplatesPage() {
  const [form, setForm] = useState({
    name: '',
    description: '',
    previewVideoUrl: '',
    captionColor: '#FFFFFF',
    fontFamily: 'Montserrat ExtraBold',
    captionAnimation: 'slideUp',
    priceCents: 0,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/marketplace/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        previewVideoUrl: form.previewVideoUrl,
        priceCents: form.priceCents,
        styleConfig: {
          captionColor: form.captionColor,
          fontFamily: form.fontFamily,
          captionAnimation: form.captionAnimation,
        },
      }),
    });
    const data = await res.json();
    if (res.ok) toast.success('Template submitted for review');
    else toast.error(data.error || 'Submit failed');
  };

  return (
    <>
      <LandingNav />
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '120px 24px 80px' }}>
        <h1 style={{ fontSize: '40px', fontWeight: 900, marginBottom: '12px' }}>Template Creators Program</h1>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '32px' }}>
          Design caption templates as JSON + CSS configs. Earn 70% on every sale — Vesper keeps 30%. Payouts run monthly
          via Stripe Connect (coming soon).
        </p>

        <form onSubmit={(e) => void submit(e)} className="glass-card" style={{ padding: '24px', display: 'grid', gap: '12px' }}>
          <input
            placeholder="Template name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="referral-input"
            required
          />
          <textarea
            placeholder="Short description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="referral-input"
            rows={3}
          />
          <input
            placeholder="Preview video URL (MP4)"
            value={form.previewVideoUrl}
            onChange={(e) => setForm((f) => ({ ...f, previewVideoUrl: e.target.value }))}
            className="referral-input"
          />
          <input
            type="color"
            value={form.captionColor}
            onChange={(e) => setForm((f) => ({ ...f, captionColor: e.target.value }))}
            aria-label="Caption color"
          />
          <input
            type="number"
            min={0}
            max={900}
            step={100}
            value={form.priceCents}
            onChange={(e) => setForm((f) => ({ ...f, priceCents: Number(e.target.value) }))}
            placeholder="Price in cents (0–900)"
            className="referral-input"
          />
          <button type="submit" className="vesper-btn vesper-btn-primary">
            Submit for review
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '14px' }}>
          <Link href="/dashboard" style={{ color: 'var(--primary)' }}>
            ← Back to Studio
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
