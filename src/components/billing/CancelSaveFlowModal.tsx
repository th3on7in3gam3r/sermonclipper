'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

type CancelReason = 'expensive' | 'not_using' | 'missing_feature' | 'switching' | 'other';

const REASONS: { id: CancelReason; label: string }[] = [
  { id: 'expensive', label: 'Too expensive' },
  { id: 'not_using', label: 'Not using it enough' },
  { id: 'missing_feature', label: 'Missing a feature I need' },
  { id: 'switching', label: 'Switching to another tool' },
  { id: 'other', label: 'Other' },
];

interface CancelSaveFlowModalProps {
  onClose: () => void;
  onOpenStripePortal: () => void;
}

export default function CancelSaveFlowModal({ onClose, onOpenStripePortal }: CancelSaveFlowModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [reason, setReason] = useState<CancelReason | null>(null);
  const [feedback, setFeedback] = useState('');
  const [competitor, setCompetitor] = useState('');

  const submitFeedback = async (acceptedOffer?: string) => {
    await fetch('/api/billing/cancel-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, feedback, competitor, acceptedOffer }),
    }).catch(() => {});
  };

  const acceptOffer = async (offer: string, message: string) => {
    await submitFeedback(offer);
    toast.success(message);
    onClose();
  };

  if (step === 1) {
    return (
      <ModalShell onClose={onClose} title="Before you go, can you tell us why?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {REASONS.map((r) => (
            <label key={r.id} className="cancel-reason-option">
              <input
                type="radio"
                name="cancel-reason"
                checked={reason === r.id}
                onChange={() => setReason(r.id)}
              />
              {r.label}
            </label>
          ))}
        </div>
        <button
          type="button"
          className="vesper-btn vesper-btn-primary"
          style={{ marginTop: '20px', width: '100%' }}
          disabled={!reason}
          onClick={() => setStep(2)}
        >
          Continue
        </button>
      </ModalShell>
    );
  }

  if (step === 2 && reason === 'expensive') {
    return (
      <ModalShell onClose={onClose} title="Stay for 50% off">
        <p className="upgrade-modal-copy">
          We can offer you 50% off for the next 3 months. Stay for $9.50/mo?
        </p>
        <button
          type="button"
          className="vesper-btn vesper-btn-primary upgrade-modal-cta"
          onClick={() => acceptOffer('discount_50_3mo', 'Offer noted — our team will apply your discount.')}
        >
          Accept offer
        </button>
        <button type="button" className="vesper-btn-outline upgrade-modal-cta" onClick={() => setStep(3)}>
          Cancel anyway
        </button>
      </ModalShell>
    );
  }

  if (step === 2 && reason === 'not_using') {
    return (
      <ModalShell onClose={onClose} title="Pause instead?">
        <p className="upgrade-modal-copy">
          Pause your subscription for 1 month — no charge, pick up where you left off.
        </p>
        <button
          type="button"
          className="vesper-btn vesper-btn-primary upgrade-modal-cta"
          onClick={() => acceptOffer('pause_1mo', 'Pause request received — check your email.')}
        >
          Pause instead
        </button>
        <button type="button" className="vesper-btn-outline upgrade-modal-cta" onClick={() => setStep(3)}>
          Cancel anyway
        </button>
      </ModalShell>
    );
  }

  if (step === 2 && reason === 'missing_feature') {
    return (
      <ModalShell onClose={onClose} title="What's missing?">
        <textarea
          className="vesper-input"
          rows={3}
          placeholder="Tell us what Vesper needs…"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          style={{ width: '100%', marginBottom: '12px' }}
        />
        <button
          type="button"
          className="vesper-btn vesper-btn-primary upgrade-modal-cta"
          onClick={() => acceptOffer('stay_feature_request', "Thanks — we'll email you when it's built.")}
        >
          Submit & stay
        </button>
        <button type="button" className="vesper-btn-outline upgrade-modal-cta" onClick={() => setStep(3)}>
          Cancel anyway
        </button>
      </ModalShell>
    );
  }

  if (step === 2 && reason === 'switching') {
    return (
      <ModalShell onClose={onClose} title="What are you switching to?">
        <input
          className="vesper-input"
          placeholder="Tool name (optional)"
          value={competitor}
          onChange={(e) => setCompetitor(e.target.value)}
          style={{ width: '100%', marginBottom: '12px' }}
        />
        <button type="button" className="vesper-btn-outline upgrade-modal-cta" onClick={() => setStep(3)}>
          Continue to cancel
        </button>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose} title="Confirm cancellation">
      <p className="upgrade-modal-copy">
        You will keep access until the end of your billing period, then your account downgrades to Free.
      </p>
      <button
        type="button"
        className="vesper-btn vesper-btn-primary upgrade-modal-cta"
        onClick={async () => {
          await submitFeedback();
          onOpenStripePortal();
        }}
      >
        Confirm in Stripe
      </button>
      <button type="button" className="vesper-btn-outline upgrade-modal-cta" onClick={onClose}>
        Keep subscription
      </button>
    </ModalShell>
  );
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="upgrade-modal-overlay" role="presentation" onClick={onClose}>
      <div className="upgrade-modal-card glass-card premium-border" onClick={(e) => e.stopPropagation()}>
        <h2 className="upgrade-modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
