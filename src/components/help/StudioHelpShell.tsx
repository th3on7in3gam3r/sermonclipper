'use client';

import { HelpProvider, HelpFloatingButton } from '@/components/help/HelpProvider';

/** Wraps Studio pages with floating help button and slide-over panel. */
export default function StudioHelpShell({ children }: { children: React.ReactNode }) {
  return (
    <HelpProvider>
      {children}
      <HelpFloatingButton />
    </HelpProvider>
  );
}
