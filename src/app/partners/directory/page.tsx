'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import SiteFooter from '@/components/layout/SiteFooter';

type Partner = {
  name: string;
  agency: string;
  website?: string;
  services?: string;
  affiliateCode?: string;
};

export default function PartnersDirectoryPage() {
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    fetch('/api/partners/directory')
      .then((r) => r.json())
      .then((d) => setPartners(d.partners || []))
      .catch(() => {});
  }, []);

  return (
    <main className="vesper-mesh-bg-container" style={{ minHeight: '100vh' }}>
      <div className="vesper-mesh-bg" />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '120px 24px 80px', position: 'relative', zIndex: 1 }}>
        <Link href="/partners" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
          ← Partner program
        </Link>
        <h1 style={{ fontSize: 36, fontWeight: 900, margin: '16px 0 8px' }}>Certified Vesper Partners</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
          Browse agencies trusted by churches for sermon media and social content.
        </p>
        <div style={{ display: 'grid', gap: 16 }}>
          {partners.map((p) => (
            <div key={p.affiliateCode || p.agency} className="glass-card premium-border" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 4px' }}>{p.agency}</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>{p.name}</p>
              {p.services && <p style={{ marginTop: 8, fontSize: 14 }}>{p.services}</p>}
              {p.website && (
                <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-violet)', fontSize: 13 }}>
                  Visit website →
                </a>
              )}
              <span className="vesper-badge badge-violet" style={{ display: 'inline-block', marginTop: 12 }}>
                Vesper Certified
              </span>
            </div>
          ))}
          {!partners.length && <p style={{ color: 'var(--text-muted)' }}>Partner directory coming soon.</p>}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
