'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { DashboardAnalyticsSummary } from '@/lib/analytics/types';

export default function DashboardAnalyticsPanel() {
  const [data, setData] = useState<DashboardAnalyticsSummary | null>(null);

  useEffect(() => {
    fetch('/api/analytics/summary')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  const wow = data.weekOverWeek;
  const wowLabel =
    wow.changePercent > 0 ? `+${wow.changePercent}%` : wow.changePercent < 0 ? `${wow.changePercent}%` : '—';

  return (
    <div className="glass-card premium-border dashboard-analytics-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Reach & performance</h2>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Refreshed every 6h</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        <StatCard label="Total reach (month)" value={data.totalReachThisMonth.toLocaleString()} />
        <StatCard
          label="Avg watch time"
          value={data.averageWatchTimeSeconds > 0 ? `${Math.round(data.averageWatchTimeSeconds)}s` : '—'}
          hint={data.averageCompletionRate >= 50 ? 'Excellent completion' : undefined}
        />
        <StatCard label="Week vs last week" value={wowLabel} sub={`${wow.viewsThisWeek.toLocaleString()} views`} />
      </div>

      {data.topClip ? (
        <div style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>
            TOP CLIP THIS MONTH
          </div>
          <p style={{ margin: 0, fontWeight: 700 }}>{data.topClip.title}</p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            {data.topClip.views.toLocaleString()} views across platforms
          </p>
        </div>
      ) : (
        <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Publish reels to connected platforms to see performance insights here.
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, hint }: { label: string; value: string; sub?: string; hint?: string }) {
  return (
    <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 900, marginTop: '4px' }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>{sub}</div>}
      {hint && <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>{hint}</div>}
    </div>
  );
}
