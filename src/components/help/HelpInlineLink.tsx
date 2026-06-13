'use client';

import Link from 'next/link';
import { useHelp } from '@/components/help/HelpProvider';

type HelpInlineLinkProps = {
  slug: string;
  label?: string;
  className?: string;
};

/** Opens the slide-over on Studio pages, or links to /help/[slug] elsewhere. */
export default function HelpInlineLink({ slug, label = 'View help guide →', className = 'help-inline-link' }: HelpInlineLinkProps) {
  const { openHelp, hasHelp } = useHelp();

  if (hasHelp) {
    return (
      <button type="button" className={className} onClick={() => openHelp(slug)}>
        {label}
      </button>
    );
  }

  return (
    <Link href={`/help/${slug}`} className={className}>
      {label}
    </Link>
  );
}
