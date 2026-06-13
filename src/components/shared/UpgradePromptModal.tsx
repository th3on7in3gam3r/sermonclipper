'use client';

import Link from 'next/link';
import { useFocusTrap } from '@/lib/useFocusTrap';

interface UpgradePromptModalProps {
  open: boolean;
  feature: string;
  planName: string;
  price: string;
  onClose: () => void;
}

export default function UpgradePromptModal({
  open,
  feature,
  planName,
  price,
  onClose,
}: UpgradePromptModalProps) {
  const trapRef = useFocusTrap(open);

  if (!open) return null;

  return (
    <div className="upgrade-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="upgrade-modal-title">
      <div className="upgrade-modal-card glass-card premium-border" ref={trapRef}>
        <p className="upgrade-modal-eyebrow">Upgrade to unlock</p>
        <h2 id="upgrade-modal-title" className="upgrade-modal-title">
          {feature}
        </h2>
        <p className="upgrade-modal-copy">
          Available on the <strong>{planName}</strong> plan — {price}
        </p>
        <Link href="/#pricing" className="vesper-btn vesper-btn-primary shimmer-effect upgrade-modal-cta" onClick={onClose}>
          Upgrade Now
        </Link>
        <button type="button" className="upgrade-modal-dismiss" onClick={onClose}>
          Maybe Later
        </button>
      </div>
    </div>
  );
}
