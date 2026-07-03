'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Milestone = {
  type: string;
  label: string;
  achievedAt: string;
};

type Summary = {
  currentStreak: number;
  bestStreak: number;
  milestones?: Milestone[];
};

const STREAK_GOAL = 8;

function streakTip(current: number): string {
  if (current >= STREAK_GOAL) return 'Legendary consistency — you are on fire every week.';
  if (current >= 4) return `${STREAK_GOAL - current} more weekly clip${STREAK_GOAL - current === 1 ? '' : 's'} to hit an 8-week run.`;
  if (current === 1) return 'Create or export a clip this week to reach a 2-week streak.';
  return 'Keep exporting at least one clip per week to grow your streak.';
}

export default function DashboardStreakPanel() {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    fetch('/api/gamification')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data || (data.currentStreak === 0 && data.bestStreak === 0)) return null;

  const recentMilestone = data.milestones?.[0];

  return (
    <div className="dashboard-streak-panel glass-card premium-border">
      <div className="dashboard-streak-header">
        <div>
          <p className="dashboard-streak-kicker">Weekly consistency</p>
          <p className="dashboard-streak-title">
            🔥 {data.currentStreak}-week streak — keep it going!
          </p>
        </div>
        <Link href="/dashboard/settings#achievements" className="dashboard-streak-trophy" title="Your achievements">
          🏆
        </Link>
      </div>

      <div className="dashboard-streak-weeks" aria-label={`${data.currentStreak} of ${STREAK_GOAL} weeks`}>
        {Array.from({ length: STREAK_GOAL }, (_, i) => (
          <span
            key={i}
            className={`dashboard-streak-week${i < data.currentStreak ? ' dashboard-streak-week--active' : ''}`}
            title={i < data.currentStreak ? `Week ${i + 1} complete` : `Week ${i + 1}`}
          />
        ))}
      </div>

      <div className="dashboard-streak-stats">
        <div>
          <span className="dashboard-streak-stat-label">Current</span>
          <strong>{data.currentStreak} wk{data.currentStreak === 1 ? '' : 's'}</strong>
        </div>
        <div>
          <span className="dashboard-streak-stat-label">Personal best</span>
          <strong>{data.bestStreak} wk{data.bestStreak === 1 ? '' : 's'}</strong>
        </div>
        <div>
          <span className="dashboard-streak-stat-label">Goal</span>
          <strong>{STREAK_GOAL} wks</strong>
        </div>
      </div>

      <p className="dashboard-streak-tip">{streakTip(data.currentStreak)}</p>

      {recentMilestone && (
        <p className="dashboard-streak-milestone">
          Latest unlock: <span>{recentMilestone.label}</span>
        </p>
      )}
    </div>
  );
}
