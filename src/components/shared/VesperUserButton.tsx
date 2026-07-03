'use client';

import { UserButton, useAuth } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';
import type { ComponentProps } from 'react';
import { navigateTo } from '@/lib/navigate';

type VesperUserButtonProps = ComponentProps<typeof UserButton>;

/** Clerk UserButton that sends users to the homepage after sign out (PWA-safe). */
export default function VesperUserButton(props: VesperUserButtonProps) {
  const { isLoaded, userId } = useAuth();
  const wasSignedIn = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (userId) {
      wasSignedIn.current = true;
      return;
    }
    if (wasSignedIn.current) {
      navigateTo('/');
    }
  }, [isLoaded, userId]);

  return <UserButton {...props} />;
}
