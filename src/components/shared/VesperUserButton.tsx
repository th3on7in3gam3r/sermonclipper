'use client';

import { UserButton } from '@clerk/nextjs';
import type { ComponentProps } from 'react';

type VesperUserButtonProps = ComponentProps<typeof UserButton>;

/** Branded Clerk UserButton — sign-out redirect handled by AuthSessionWatcher. */
export default function VesperUserButton(props: VesperUserButtonProps) {
  return <UserButton {...props} />;
}
