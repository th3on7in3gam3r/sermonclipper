'use client';

import Link from 'next/link';
import { formatResetDate, getUsageResetDate } from '@/lib/plans';

interface QuotaDisplayProps {
  usageCount?: number;
  limit?: number;
  lastUsageReset?: string;
  compact?: boolean;
}

export default function QuotaDisplay({
  usageCount = 0,
  limit = 2,
  lastUsageReset,
  compact = false,
}: QuotaDisplayProps) {
  const isUnlimited = limit >= 999999;
  const remaining = isUnlimited ? null : Math.max(0, limit - usageCount);
  const usedPct = isUnlimited ? 0 : Math.min(100, Math.round((usageCount / limit) * 100));
  const atLimit = !isUnlimited && remaining === 0;
  const resetDate = formatResetDate(getUsageResetDate(lastUsageReset));

  return (
    <div
      className={`quota-display${atLimit ? ' quota-display--limit' : ''}${compact ? ' quota-display--compact' : ''}`}
    >
      <div className="quota-display-header">
        <span className="quota-display-label">
          {isUnlimited ? 'Unlimited clips' : `${usageCount} of ${limit} clips used this month`}
        </span>
        {!isUnlimited && <span className="quota-display-remaining">{remaining} left</span>}
      </div>

      {!isUnlimited && (
        <div
          className="quota-display-bar"
          role="progressbar"
          aria-valuenow={usageCount}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-label="Monthly clip usage"
        >
          <div className="quota-display-bar-fill" style={{ width: `${usedPct}%` }} />
        </div>
      )}

      <p className="quota-display-reset">Resets on {resetDate}</p>

      {atLimit && (
        <Link href="/#pricing" className="quota-display-upgrade">
          You&apos;ve used all your clips this month. Upgrade to get more →
        </Link>
      )}
    </div>
  );
}
