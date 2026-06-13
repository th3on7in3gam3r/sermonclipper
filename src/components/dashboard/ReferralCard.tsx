'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function ReferralCard() {
  const [data, setData] = useState<{
    link: string;
    shareMessage: string;
    stats: { referred: number; upgrades: number; monthsEarned: number };
  } | null>(null);

  useEffect(() => {
    fetch('/api/referral')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  return (
    <div className="glass-card premium-border referral-card" style={{ padding: '24px', marginTop: '24px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>Refer a Church</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
        Share Vesper with another church. When they upgrade, you earn a free month on your plan.
      </p>
      <p style={{ fontSize: '13px', marginBottom: '8px' }}>
        <strong>{data.stats.referred}</strong> churches referred · <strong>{data.stats.upgrades}</strong> upgrades ·{' '}
        <strong>{data.stats.monthsEarned}</strong> months earned
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <input readOnly value={data.link} className="referral-input" aria-label="Referral link" />
        <button type="button" className="vesper-btn-outline" onClick={() => copy(data.link, 'Link copied')}>
          Copy link
        </button>
      </div>
      <button type="button" className="vesper-btn-outline" onClick={() => copy(data.shareMessage, 'Message copied')}>
        Copy share message
      </button>
    </div>
  );
}
