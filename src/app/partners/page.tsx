'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import SiteFooter from '@/components/layout/SiteFooter';

export default function PartnersPage() {
  const [name, setName] = useState('');
  const [agency, setAgency] = useState('');
  const [website, setWebsite] = useState('');
  const [churches, setChurches] = useState('');
  const [services, setServices] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/partners/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, agency, website, churchesServed: churches, services }),
    });
    if (res.ok) toast.success('Application received — we will be in touch');
    else toast.error('Submission failed');
  };

  return (
    <main className="vesper-mesh-bg-container" style={{ minHeight: '100vh' }}>
      <div className="vesper-mesh-bg" />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px 80px', position: 'relative', zIndex: 1 }}>
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
          ← Home
        </Link>
        <h1 style={{ fontSize: 36, fontWeight: 900, margin: '16px 0 8px' }}>Vesper Partner Program</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
          Church media consultants and agencies earn 20% recurring revenue share, co-branded materials, and early
          access. Certified Partner at 5+ referrals · Premier Partner at 20+.
        </p>
        <Link href="/partners/directory" style={{ color: 'var(--accent-violet)', fontSize: 14, fontWeight: 700 }}>
          Browse certified partners →
        </Link>
        <form onSubmit={submit} className="glass-card premium-border" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          <input className="vesper-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="vesper-input" placeholder="Agency name" value={agency} onChange={(e) => setAgency(e.target.value)} required />
          <input className="vesper-input" placeholder="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
          <input className="vesper-input" placeholder="Churches you serve" value={churches} onChange={(e) => setChurches(e.target.value)} />
          <textarea className="vesper-input" rows={3} placeholder="Services offered" value={services} onChange={(e) => setServices(e.target.value)} />
          <button type="submit" className="vesper-btn vesper-btn-primary">
            Apply to partner program
          </button>
        </form>
      </div>
      <SiteFooter />
    </main>
  );
}
