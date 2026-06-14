'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { ClipAnalyticsResponse } from '@/lib/analytics/types';

const PLATFORM_META = {
  youtube: { label: 'YouTube Shorts', icon: '▶️' },
  instagram: { label: 'Instagram Reels', icon: '📸' },
  tiktok: { label: 'TikTok', icon: '📱' },
} as const;

type Props = {
  clipId: string;
  clipTitle: string;
};

export default function StudioClipAnalyticsPanel({ clipId, clipTitle }: Props) {
  const [data, setData] = useState<ClipAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/analytics/clip/${encodeURIComponent(clipId)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load analytics.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clipId]);

  if (loading) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading analytics…</p>;
  }

  if (error || !data) {
    return <p style={{ color: '#FCA5A5', fontSize: '14px' }}>{error || 'No analytics yet.'}</p>;
  }

  const hasMetrics = data.platforms.some((p) => p.available && p.views > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{clipTitle}</p>
        {data.stale && (
          <p style={{ fontSize: '11px', color: '#FBBF24' }}>Metrics refresh every 6 hours.</p>
        )}
      </div>

      {!hasMetrics ? (
        <div className="glass-card" style={{ padding: '16px' }}>
          <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--text-muted)' }}>
            Publish this reel to a connected platform to see views, likes, and watch time here.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'Views', value: data.totals.views },
              { label: 'Likes', value: data.totals.likes },
              { label: 'Comments', value: data.totals.comments },
              { label: 'Shares', value: data.totals.shares },
            ].map((stat) => (
              <div key={stat.label} className="glass-card" style={{ padding: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800 }}>{stat.label}</div>
                <div style={{ fontSize: '22px', fontWeight: 900 }}>{stat.value.toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.platforms.map((platform) => {
              const meta = PLATFORM_META[platform.platform];
              return (
                <div key={platform.platform} className="glass-card" style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800 }}>
                      {meta.icon} {meta.label}
                    </span>
                    <span style={{ fontSize: '12px', color: platform.connected ? '#10B981' : 'var(--text-muted)' }}>
                      {platform.available ? `${platform.views.toLocaleString()} views` : platform.connected ? 'Awaiting publish' : 'Not connected'}
                    </span>
                  </div>
                  {platform.available && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>👍 {platform.likes}</span>
                      <span>💬 {platform.comments}</span>
                      {platform.ctr > 0 && <span>CTR {(platform.ctr * 100).toFixed(1)}%</span>}
                      {platform.avgViewDurationSeconds > 0 && (
                        <span>Avg {platform.avgViewDurationSeconds}s</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="glass-card" style={{ padding: '12px', height: '180px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>
              7-DAY VIEWS
            </div>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={data.trend}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#71717A', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: '#71717A', fontSize: 10 }} width={32} />
                <Tooltip contentStyle={{ background: '#14141D', border: '1px solid #333', borderRadius: 8 }} />
                <Line type="monotone" dataKey="views" stroke="#8B5CF6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {data.bestEngagementHour != null && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Best engagement window: around{' '}
              <strong style={{ color: '#fff' }}>
                {data.bestEngagementHour === 0 ? '12 AM' : data.bestEngagementHour <= 12 ? `${data.bestEngagementHour} AM` : `${data.bestEngagementHour - 12} PM`}
              </strong>
            </p>
          )}

          {data.totals.avgCompletionRate > 0 && (
            <p style={{ fontSize: '13px', color: data.totals.avgCompletionRate >= 50 ? '#10B981' : 'var(--text-muted)' }}>
              Avg completion: {data.totals.avgCompletionRate.toFixed(0)}%
              {data.totals.avgCompletionRate >= 50 ? ' — excellent for sermon content' : ''}
            </p>
          )}
        </>
      )}
    </div>
  );
}
