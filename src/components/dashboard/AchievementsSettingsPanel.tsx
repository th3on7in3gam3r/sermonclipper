'use client';

import { useEffect, useState } from 'react';
import { MILESTONE_LABELS, type MilestoneType } from '@/lib/gamification/labels';

type MilestoneRow = { type: MilestoneType; label: string; achievedAt: string };

export default function AchievementsSettingsPanel() {
  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
  const [allTypes, setAllTypes] = useState<MilestoneType[]>([]);

  useEffect(() => {
    fetch('/api/gamification')
      .then((r) => r.json())
      .then((d) => {
        setMilestones(d.milestones || []);
        setAllTypes(d.allMilestoneTypes || []);
      });
  }, []);

  const achieved = new Set(milestones.map((m) => m.type));

  return (
    <div className="glass-card premium-border" style={{ padding: '24px', marginBottom: '24px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>Your achievements</h2>
      <div style={{ display: 'grid', gap: '10px' }}>
        {allTypes.map((type) => {
          const unlocked = achieved.has(type);
          const row = milestones.find((m) => m.type === type);
          return (
            <div
              key={type}
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                opacity: unlocked ? 1 : 0.45,
                background: unlocked ? 'rgba(139,92,246,0.08)' : 'transparent',
              }}
            >
              <div style={{ fontWeight: 800 }}>{MILESTONE_LABELS[type]}</div>
              {row?.achievedAt && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Unlocked {new Date(row.achievedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
