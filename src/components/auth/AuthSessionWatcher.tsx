'use client';

import { useAuth, useClerk } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { navigateTo } from '@/lib/navigate';

const PROTECTED_PREFIXES = ['/dashboard', '/results', '/admin', '/studio'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

declare global {
  interface Window {
    __internal_onAfterSetActive?: () => void | Promise<void>;
    Clerk?: { session?: unknown | null };
  }
}

/** Hard-redirect signed-out users off protected routes (Clerk + PWA safe). */
export default function AuthSessionWatcher() {
  const { isLoaded, userId } = useAuth();
  const clerk = useClerk();
  const pathname = usePathname() ?? '';
  const wasSignedIn = useRef(false);
  const redirecting = useRef(false);

  const redirectHome = () => {
    if (redirecting.current) return;
    redirecting.current = true;
    navigateTo('/');
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (userId) {
      wasSignedIn.current = true;
      return;
    }
    if (wasSignedIn.current || isProtectedPath(pathname)) {
      redirectHome();
    }
  }, [isLoaded, userId, pathname]);

  useEffect(() => {
    if (!clerk.loaded) return;

    const unsubscribe = clerk.addListener((emission) => {
      if (emission.session) {
        wasSignedIn.current = true;
        return;
      }
      if (wasSignedIn.current || isProtectedPath(window.location.pathname)) {
        redirectHome();
      }
    });

    return unsubscribe;
  }, [clerk, clerk.loaded]);

  // Clerk on Next 15/16 calls router.refresh() after sign-out instead of navigating
  // to afterSignOutUrl. Patch the hook so a signed-out refresh leaves protected pages.
  useEffect(() => {
    const previous = window.__internal_onAfterSetActive;
    window.__internal_onAfterSetActive = async () => {
      await previous?.();
      if (!window.Clerk?.session && isProtectedPath(window.location.pathname)) {
        redirectHome();
      }
    };
    return () => {
      window.__internal_onAfterSetActive = previous;
    };
  }, []);

  return null;
}
