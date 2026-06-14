'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { marketplaceTemplateId } from '@/lib/marketplace/ids';

type MarketplaceTemplate = {
  id: string;
  mongoId: string;
  name: string;
  description?: string;
  previewVideoUrl?: string;
  priceCents: number;
  featured?: boolean;
  isNew?: boolean;
  owned: boolean;
  free: boolean;
};

type Props = {
  selectedTemplate: string;
  onSelect: (templateId: string) => void;
};

export default function MarketplaceTemplatesPanel({ selectedTemplate, onSelect }: Props) {
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/marketplace/templates')
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates || []))
      .finally(() => setLoading(false));
  }, []);

  const unlock = async (t: MarketplaceTemplate) => {
    if (t.owned || t.free) {
      onSelect(t.id);
      return;
    }
    const res = await fetch(`/api/marketplace/templates/${t.mongoId}/purchase`, { method: 'POST' });
    const data = await res.json();
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    else if (data.unlocked) {
      toast.success('Template unlocked');
      onSelect(t.id);
      setTemplates((prev) => prev.map((row) => (row.mongoId === t.mongoId ? { ...row, owned: true } : row)));
    } else toast.error(data.error || 'Purchase failed');
  };

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Loading marketplace…</p>;

  if (templates.length === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
        No marketplace templates yet. Designers can submit at{' '}
        <a href="/creators/templates" style={{ color: 'var(--primary)' }}>
          /creators/templates
        </a>
        .
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {templates.map((t) => (
        <div
          key={t.id}
          className="glass-card"
          style={{
            padding: '14px',
            borderColor: selectedTemplate === t.id ? 'var(--primary)' : 'var(--card-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
            <strong>{t.name}</strong>
            <span style={{ display: 'flex', gap: '6px' }}>
              {t.featured && <span className="vesper-badge badge-gold">Featured</span>}
              {t.isNew && <span className="vesper-badge badge-green">New</span>}
            </span>
          </div>
          {t.description && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 8px' }}>{t.description}</p>
          )}
          {t.previewVideoUrl && (
            <video
              src={t.previewVideoUrl}
              muted
              loop
              playsInline
              autoPlay
              style={{ width: '100%', borderRadius: '12px', marginBottom: '10px', maxHeight: '120px', objectFit: 'cover' }}
            />
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="vesper-btn vesper-btn-outline"
              style={{ flex: 1 }}
              onClick={() => (t.owned || t.free ? onSelect(t.id) : unlock(t))}
            >
              {t.owned || t.free ? (selectedTemplate === t.id ? 'Selected' : 'Use template') : `Unlock $${(t.priceCents / 100).toFixed(2)}`}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
