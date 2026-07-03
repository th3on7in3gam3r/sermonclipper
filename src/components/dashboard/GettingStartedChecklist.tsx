'use client';

import { useEffect, useState } from 'react';
import HelpInlineLink from '@/components/help/HelpInlineLink';

type Checklist = Record<string, boolean>;

const ITEMS: {
  key: keyof Checklist;
  label: string;
  href: string;
  helpSlug: string;
  churchProOnly?: boolean;
}[] = [
  { key: 'uploadedSermon', label: 'Upload your first sermon', href: '/#upload', helpSlug: 'supported-file-formats' },
  { key: 'createdClip', label: 'Create your first clip', href: '/#upload', helpSlug: 'creating-your-first-clip' },
  { key: 'customizedCaption', label: 'Customize a caption template', href: '/#upload', helpSlug: 'caption-templates' },
  { key: 'exportedReel', label: 'Export your first reel', href: '/#upload', helpSlug: 'export-formats' },
  { key: 'connectedSocial', label: 'Connect a social account', href: '/dashboard/settings', helpSlug: 'connecting-social-accounts' },
  {
    key: 'invitedTeamMember',
    label: 'Invite a team member',
    href: '/dashboard/team',
    helpSlug: 'upgrade-downgrade',
    churchProOnly: true,
  },
];

type GettingStartedChecklistProps = {
  compact?: boolean;
};

export default function GettingStartedChecklist({ compact = false }: GettingStartedChecklistProps) {
  const [checklist, setChecklist] = useState<Checklist>({});
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(6);
  const [plan, setPlan] = useState('free');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetch('/api/user/checklist')
      .then((r) => r.json())
      .then((d) => {
        setChecklist(d.checklist || {});
        setCompleted(d.completed || 0);
        setTotal(d.total || 6);
        setPlan(d.plan || 'free');
        if (d.completed >= d.total) setCollapsed(true);
      })
      .catch(() => {});
  }, []);

  const visibleItems = ITEMS.filter((i) => !i.churchProOnly || plan === 'church_pro');
  const doneCount = visibleItems.filter((i) => checklist[i.key]).length;
  const progressPct = visibleItems.length ? Math.round((doneCount / visibleItems.length) * 100) : 0;
  const pendingItems = visibleItems.filter((i) => !checklist[i.key]);
  const listItems = compact && pendingItems.length > 0 ? pendingItems : visibleItems;

  if (collapsed && completed >= total) {
    return (
      <div className={`getting-started getting-started-done glass-card premium-border${compact ? ' getting-started--compact' : ''}`}>
        <p>You&apos;re all set — happy clipping!</p>
      </div>
    );
  }

  return (
    <div className={`getting-started glass-card premium-border${compact ? ' getting-started--compact' : ''}`}>
      <div className="getting-started-header">
        <div>
          <h3>Getting started</h3>
          {compact ? (
            <p className="getting-started-subtitle getting-started-subtitle--compact">
              {doneCount} of {visibleItems.length} complete
            </p>
          ) : (
            <p className="getting-started-subtitle">Complete these steps to get the most from Vesper</p>
          )}
        </div>
        <span className="getting-started-count" title={`${doneCount} of ${visibleItems.length} steps complete`}>
          {compact ? `${pendingItems.length} left` : `${doneCount}/${visibleItems.length}`}
        </span>
      </div>
      <div
        className="getting-started-bar"
        role="progressbar"
        aria-valuenow={doneCount}
        aria-valuemin={0}
        aria-valuemax={visibleItems.length}
        aria-label={`${progressPct}% complete`}
      >
        <div className="getting-started-bar-fill" style={{ width: `${progressPct}%` }} />
      </div>
      <ul className="getting-started-list">
        {listItems.map((item) => {
          const done = Boolean(checklist[item.key]);
          return (
            <li key={item.key} className={done ? 'done' : ''}>
              <span className={`getting-started-check${done ? ' getting-started-check--done' : ''}`} aria-hidden="true">
                {done ? '✓' : ''}
              </span>
              <div className="getting-started-row">
                {done ? (
                  <span className="getting-started-label">{item.label}</span>
                ) : (
                  <button
                    type="button"
                    className="getting-started-label getting-started-label--action"
                    onClick={() => {
                      window.location.assign(item.href);
                    }}
                  >
                    {item.label}
                  </button>
                )}
                {!done && (
                  <HelpInlineLink
                    slug={item.helpSlug}
                    label={compact ? '?' : 'Guide'}
                    className="help-inline-link help-inline-link--compact"
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {compact && pendingItems.length === 0 && doneCount > 0 && (
        <p className="getting-started-compact-done">All steps complete — you&apos;re ready to clip every week.</p>
      )}
      {compact && (
        <p className="getting-started-footer">Tap a step to jump there · ? opens the guide</p>
      )}
    </div>
  );
}
