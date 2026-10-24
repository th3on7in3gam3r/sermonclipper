'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(max-width: 1023.98px)';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/** True below 1024px. Uses matchMedia (fires only on breakpoint crossings, not every resize). */
export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  );
}
