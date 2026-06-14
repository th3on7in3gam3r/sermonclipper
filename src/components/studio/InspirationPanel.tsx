'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { InspirationItem } from '@/lib/inspiration/fetchInspiration';

export default function InspirationPanel() {
  const [items, setItems] = useState<InspirationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [minViews, setMinViews] = useState('0');
  const [platform, setPlatform] = useState('all');

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (minViews !== '0') params.set('minViews', minViews);
    if (platform !== 'all') params.set('platform', platform);
    fetch(`/api/inspiration?${params}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
        Public content from other creators — shown for inspiration only. Vesper does not download or re-host any
        videos.
      </p>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <select
          value={minViews}
          onChange={(e) => setMinViews(e.target.value)}
          className="referral-input"
          style={{ flex: 1, minWidth: '120px' }}
        >
          <option value="0">Any views</option>
          <option value="10000">10K+ views</option>
          <option value="100000">100K+ views</option>
        </select>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="referral-input"
          style={{ flex: 1, minWidth: '120px' }}
        >
          <option value="all">All platforms</option>
          <option value="youtube">YouTube</option>
          <option value="tiktok">TikTok</option>
        </select>
        <button type="button" className="vesper-btn-outline" onClick={load}>
          Filter
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading inspiration feed…</p>
      ) : (
        items.map((item) => (
          <div key={item.id} className="glass-card" style={{ padding: '12px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              {item.thumbnailUrl && (
                <img
                  src={item.thumbnailUrl}
                  alt=""
                  style={{ width: '72px', height: '96px', objectFit: 'cover', borderRadius: '8px' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>{item.title}</strong>
                <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'var(--text-muted)' }}>{item.caption}</p>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)' }}>
                  {item.platform.toUpperCase()}
                  {item.viewCount ? ` · ${item.viewCount.toLocaleString()} views` : ''}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <a
                href={item.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="vesper-btn-outline"
                style={{ fontSize: '11px', padding: '8px 10px', textDecoration: 'none' }}
              >
                View original
              </a>
              <button
                type="button"
                className="vesper-btn vesper-btn-primary"
                style={{ fontSize: '11px', padding: '8px 10px' }}
                onClick={() => {
                  const hints = item.styleHints;
                  toast.success(
                    hints
                      ? `Style: ${hints.templateStyle} · ${hints.textPlacement} · ${hints.colorPalette}`
                      : 'Minimal hook · Lower third · White on charcoal',
                    { duration: 5000 }
                  );
                }}
              >
                Analyze Style
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
