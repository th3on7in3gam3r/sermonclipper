'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { captureEvent, identifyUser, initAnalytics } from '@/lib/analytics';
import { hasAnalyticsConsent } from '@/lib/consent';
import { setSentryUserContext } from '@/lib/sentryUser';

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { userId } = useAuth();

  useEffect(() => {
    initAnalytics();
    const onConsent = () => initAnalytics();
    window.addEventListener('vesper:consent', onConsent);
    return () => window.removeEventListener('vesper:consent', onConsent);
  }, []);

  useEffect(() => {
    if (userId) {
      const ref = typeof window !== 'undefined' ? window.localStorage.getItem('vesper_ref') : null;
      identifyUser(userId);
      setSentryUserContext(userId);
      if (ref) {
        fetch(`/api/user/status?ref=${encodeURIComponent(ref)}`).catch(() => {});
      }
    }
  }, [userId]);

  useEffect(() => {
    if (pathname === '/' && hasAnalyticsConsent()) {
      captureEvent('page_viewed', { page: 'landing' });
    }
    const ref = searchParams.get('ref');
    if (ref && typeof window !== 'undefined') {
      window.localStorage.setItem('vesper_ref', ref);
    }
  }, [pathname, searchParams]);

  return children;
}
