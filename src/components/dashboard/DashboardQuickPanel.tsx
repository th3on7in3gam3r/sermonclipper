'use client';

import HardLink from '@/components/shared/HardLink';
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
  const studioHref = latest ? buildStudioHref(latest.jobId, 0) : null;

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

          {studioHref ? (
            <HardLink href={studioHref} className="dashboard-quick-continue">
              <span className="dashboard-quick-continue-label">Continue editing</span>
              <p className="dashboard-quick-continue-title">{latest.title}</p>
              <p className="dashboard-quick-continue-meta">
                {latestClipCount} clip{latestClipCount === 1 ? '' : 's'} ·{' '}
                {new Date(latest.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </HardLink>
          ) : null}
        </>
      ) : (
        <p className="dashboard-quick-empty">
          Upload your first sermon to start generating reels for social.
        </p>
      )}

      <div className="dashboard-quick-actions">
        <HardLink href="/#upload" className="dashboard-quick-action dashboard-quick-action--primary">
          Upload sermon
        </HardLink>
        {studioHref ? (
          <HardLink href={studioHref} className="dashboard-quick-action">
            Open in Studio
          </HardLink>
        ) : (
          <HardLink href="/showcase" className="dashboard-quick-action">
            View showcase
          </HardLink>
        )}
        <HardLink href="/dashboard/settings" className="dashboard-quick-action">
          Settings
        </HardLink>
      </div>
    </div>
  );
}
