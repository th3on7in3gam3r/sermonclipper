'use client';

import { useEffect, useState } from 'react';

type Summary = {
  currentStreak: number;
  bestStreak: number;
};

export default function DashboardStreakPanel() {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    fetch('/api/gamification')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data || (data.currentStreak === 0 && data.bestStreak === 0)) return null;

  return (
    <div className="glass-card premium-border" style={{ padding: '16px 20px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '18px', fontWeight: 900 }}>
          🔥 {data.currentStreak}-week streak — keep it going!
        </div>
        <a href="/dashboard/settings#achievements" title="Your achievements" style={{ fontSize: '22px' }}>
          🏆
        </a>
      </div>
      {data.bestStreak > data.currentStreak && (
        <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
          Personal best: {data.bestStreak} weeks
        </p>
      )}
    </div>
  );
}
