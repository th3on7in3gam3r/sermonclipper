'use client';

import { useEffect, useState } from 'react';
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
    <div className="glass-card premium-border dashboard-analytics-panel">
      <div className="dashboard-analytics-header">
        <h2>Reach & performance</h2>
        <span>Refreshed every 6h</span>
      </div>

      <div className="dashboard-analytics-stats">
        <StatCard label="Total reach (month)" value={data.totalReachThisMonth.toLocaleString()} />
        <StatCard
          label="Avg watch time"
          value={data.averageWatchTimeSeconds > 0 ? `${Math.round(data.averageWatchTimeSeconds)}s` : '—'}
          hint={data.averageCompletionRate >= 50 ? 'Excellent completion' : undefined}
        />
        <StatCard label="Week vs last week" value={wowLabel} sub={`${wow.viewsThisWeek.toLocaleString()} views`} />
      </div>

      <div className="dashboard-analytics-footer">
        {data.topClip ? (
          <div className="dashboard-analytics-top-clip">
            <div className="dashboard-analytics-top-label">Top clip this month</div>
            <p className="dashboard-analytics-top-title">{data.topClip.title}</p>
            <p className="dashboard-analytics-top-meta">
              {data.topClip.views.toLocaleString()} views across platforms
            </p>
          </div>
        ) : (
          <p className="dashboard-analytics-empty">
            Publish reels to connected platforms to see performance insights here.
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, hint }: { label: string; value: string; sub?: string; hint?: string }) {
  return (
    <div className="dashboard-analytics-stat">
      <div className="dashboard-analytics-stat-label">{label}</div>
      <div className="dashboard-analytics-stat-value">{value}</div>
      {sub && <div className="dashboard-analytics-stat-sub">{sub}</div>}
      {hint && <div className="dashboard-analytics-stat-hint">{hint}</div>}
    </div>
  );
}
