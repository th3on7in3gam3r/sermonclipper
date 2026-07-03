'use client';

import Link from 'next/link';
import { buildStudioHref } from '@/lib/studioNavigation';
import type { SermonRecord } from '@/components/dashboard/ClipLibrary';

type DashboardQuickPanelProps = {
  sermons: SermonRecord[];
  loading?: boolean;
};

function countClips(sermons: SermonRecord[]) {
  return sermons.reduce((sum, s) => sum + (s.analysis?.clips?.length ?? 0), 0);
}

export default function DashboardQuickPanel({ sermons, loading }: DashboardQuickPanelProps) {
  const latest = sermons[0];
  const clipCount = countClips(sermons);
  const latestClipCount = latest?.analysis?.clips?.length ?? 0;

  return (
    <div className="dashboard-quick-panel glass-card premium-border">
      <p className="dashboard-quick-kicker">Quick actions</p>

      {loading ? (
        <p className="dashboard-quick-loading">Loading your library…</p>
      ) : latest ? (
        <>
          <div className="dashboard-quick-stats">
            <div>
              <span className="dashboard-quick-stat-label">Sermons</span>
              <strong>{sermons.length}</strong>
            </div>
            <div>
              <span className="dashboard-quick-stat-label">Clips ready</span>
              <strong>{clipCount}</strong>
            </div>
          </div>

          <div className="dashboard-quick-continue">
            <span className="dashboard-quick-continue-label">Continue editing</span>
            <p className="dashboard-quick-continue-title">{latest.title}</p>
            <p className="dashboard-quick-continue-meta">
              {latestClipCount} clip{latestClipCount === 1 ? '' : 's'} ·{' '}
              {new Date(latest.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </>
      ) : (
        <p className="dashboard-quick-empty">
          Upload your first sermon to start generating reels for social.
        </p>
      )}

      <div className="dashboard-quick-actions">
        <Link href="/#upload" className="dashboard-quick-action dashboard-quick-action--primary">
          Upload sermon
        </Link>
        {latest ? (
          <Link href={buildStudioHref(latest.jobId, 0)} className="dashboard-quick-action">
            Open in Studio
          </Link>
        ) : (
          <Link href="/showcase" className="dashboard-quick-action">
            View showcase
          </Link>
        )}
        <Link href="/dashboard/settings" className="dashboard-quick-action">
          Settings
        </Link>
      </div>
    </div>
  );
}
