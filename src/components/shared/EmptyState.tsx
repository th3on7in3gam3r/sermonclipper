'use client';

import HardLink from '@/components/shared/HardLink';

interface EmptyStateProps {
  icon?: string;
  headline: string;
  subtext: string;
  ctaLabel: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  compact?: boolean;
}

export default function EmptyState({
  icon = '🎬',
  headline,
  subtext,
  ctaLabel,
  ctaHref = '/',
  onCtaClick,
  compact = false,
}: EmptyStateProps) {
  const ctaClass = 'vesper-btn vesper-btn-primary shimmer-effect empty-state-cta';
  const wrapperClass = `empty-state glass-card premium-border${compact ? ' empty-state-compact' : ''}`;

  return (
    <div className={wrapperClass}>
      <div className="empty-state-icon" aria-hidden="true">
        {icon}
      </div>
      <h3 className="empty-state-headline">{headline}</h3>
      <p className="empty-state-subtext">{subtext}</p>
      {onCtaClick ? (
        <button type="button" className={ctaClass} onClick={onCtaClick}>
          {ctaLabel}
        </button>
      ) : (
        <HardLink href={ctaHref} className={ctaClass}>
          {ctaLabel}
        </HardLink>
      )}
    </div>
  );
}
