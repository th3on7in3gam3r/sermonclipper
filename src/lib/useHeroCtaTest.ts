'use client';

import { useCallback, useEffect, useState } from 'react';
import { getHeroCtaLabel, getHeroCtaVariant, type HeroCtaVariant } from '@/lib/hash';
import { captureEvent } from '@/lib/analytics';

const STORAGE_KEY = 'vesper_anonymous_id';
const TEST_NAME = 'hero_cta';

function getAnonymousId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

async function trackAbEvent(
  variant: HeroCtaVariant,
  eventType: 'impression' | 'click' | 'signup',
  userId?: string
) {
  captureEvent(`ab_${TEST_NAME}_${eventType}`, { variant, testName: TEST_NAME });
  fetch('/api/ab-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      testName: TEST_NAME,
      variant,
      eventType,
      anonymousId: getAnonymousId(),
      userId,
    }),
  }).catch(() => {});
}

export function useHeroCtaTest(userId?: string | null) {
  const [variant, setVariant] = useState<HeroCtaVariant>('A');
  const label = getHeroCtaLabel(variant);

  useEffect(() => {
    const v = getHeroCtaVariant(getAnonymousId());
    setVariant(v);
    void trackAbEvent(v, 'impression', userId || undefined);
  }, [userId]);

  const onCtaClick = useCallback(() => {
    void trackAbEvent(variant, 'click', userId || undefined);
  }, [variant, userId]);

  return {
    variant,
    label,
    onCtaClick,
    trackSignup: () => trackAbEvent(variant, 'signup', userId || undefined),
  };
}

export function trackHeroSignupConversion(userId?: string) {
  const variant = getHeroCtaVariant(getAnonymousId());
  void trackAbEvent(variant, 'signup', userId);
}
