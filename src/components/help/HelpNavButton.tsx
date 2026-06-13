'use client';

import { useHelp } from '@/components/help/HelpProvider';

export default function HelpNavButton({ className = 'help-nav-btn' }: { className?: string }) {
  const { openHelp } = useHelp();

  return (
    <button type="button" className={className} onClick={() => openHelp()} title="Help Center">
      Help
    </button>
  );
}
