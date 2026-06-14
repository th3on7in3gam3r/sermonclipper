'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { MILESTONE_LABELS, type MilestoneType } from '@/lib/gamification/labels';

const STORAGE_KEY = 'vesper_seen_milestones';

export default function MilestoneToastListener() {
  useEffect(() => {
    fetch('/api/gamification')
      .then((r) => r.json())
      .then((data) => {
        const achieved = (data.milestones || []).map((m: { type: MilestoneType }) => m.type);
        const seenRaw = localStorage.getItem(STORAGE_KEY);
        if (!seenRaw) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(achieved));
          return;
        }
        const seen: string[] = JSON.parse(seenRaw);
        const fresh = achieved.filter((type: string) => !seen.includes(type));
        fresh.forEach((type: MilestoneType) => {
          toast.success(`Achievement unlocked: ${MILESTONE_LABELS[type]}!`);
        });
        if (achieved.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(achieved));
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
