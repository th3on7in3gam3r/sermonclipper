'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { isOnboardingCompleteLocally, markOnboardingCompleteLocally } from '@/lib/onboardingStorage';

/** Whether the onboarding wizard should show — signed-in users only. */
export function useOnboarding(forceShow = false) {
  const { isLoaded, userId } = useAuth();
  // Result of the server/local check, tagged with the user it was computed for.
  const [checked, setChecked] = useState<{ userId: string; needs: boolean } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isLoaded || !userId || forceShow) return;
    let cancelled = false;

    (async () => {
      let needs = false;
      if (isOnboardingCompleteLocally(userId)) {
        // Already done in this browser; sync to the server (retries next visit on failure).
        await fetch('/api/user/onboarding', { method: 'POST' }).catch(() => {});
      } else {
        try {
          const res = await fetch('/api/user/status');
          if (res.ok) needs = !(await res.json()).onboardingComplete;
        } catch {
          /* treat as not needed */
        }
      }
      if (!cancelled) setChecked({ userId, needs });
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, forceShow]);

  const completeOnboarding = useCallback(async () => {
    if (userId) {
      markOnboardingCompleteLocally(userId);
      // localStorage keeps the wizard dismissed for this browser even if this fails.
      await fetch('/api/user/onboarding', { method: 'POST' }).catch(() => {});
    }
    setDismissed(true);
  }, [userId]);

  const needs = forceShow || (checked !== null && checked.userId === userId && checked.needs);
  const showOnboarding = isLoaded && Boolean(userId) && !dismissed && needs;

  return { showOnboarding, completeOnboarding };
}
