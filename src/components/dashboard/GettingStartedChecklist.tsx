'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Checklist = Record<string, boolean>;

const ITEMS: { key: keyof Checklist; label: string; href: string; churchProOnly?: boolean }[] = [
  { key: 'uploadedSermon', label: 'Upload your first sermon video', href: '/#upload' },
  { key: 'createdClip', label: 'Create your first clip', href: '/#upload' },
  { key: 'customizedCaption', label: 'Customize a caption template', href: '/dashboard' },
  { key: 'exportedReel', label: 'Export your first reel', href: '/dashboard' },
  { key: 'connectedSocial', label: 'Connect a social account', href: '/dashboard/settings' },
  { key: 'invitedTeamMember', label: 'Invite a team member', href: '/dashboard/team', churchProOnly: true },
];

export default function GettingStartedChecklist() {
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

  if (collapsed && completed >= total) {
    return (
      <div className="getting-started-done glass-card">
        <p>You&apos;re all set! 🎉</p>
      </div>
    );
  }

  const doneCount = visibleItems.filter((i) => checklist[i.key]).length;

  return (
    <div className="getting-started glass-card premium-border">
      <div className="getting-started-header">
        <h3>Getting Started</h3>
        <span>
          {doneCount} of {visibleItems.length} tasks complete
        </span>
      </div>
      <div
        className="getting-started-bar"
        role="progressbar"
        aria-valuenow={doneCount}
        aria-valuemin={0}
        aria-valuemax={visibleItems.length}
      >
        <div
          className="getting-started-bar-fill"
          style={{ width: `${(doneCount / visibleItems.length) * 100}%` }}
        />
      </div>
      <ul className="getting-started-list">
        {visibleItems.map((item) => (
          <li key={item.key} className={checklist[item.key] ? 'done' : ''}>
            {checklist[item.key] ? '☑' : '☐'}{' '}
            {checklist[item.key] ? <span>{item.label}</span> : <Link href={item.href}>{item.label}</Link>}
          </li>
        ))}
      </ul>
    </div>
  );
}
