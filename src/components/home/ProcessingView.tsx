'use client';

import { useEffect, useState, useRef } from 'react';
import HelpInlineLink from '@/components/help/HelpInlineLink';

const DEFAULT_STEPS = [
  { id: 'upload', label: 'Uploading…' },
  { id: 'analyze', label: 'Analyzing sermon…' },
  { id: 'moments', label: 'Finding key moments…' },
  { id: 'ready', label: 'Almost ready…' },
];

interface ProcessingViewProps {
  steps?: { id: string; label: string }[];
  currentStepIndex: number;
  statusMessage: string;
  startedAt?: number;
  error?: string | null;
  onRetry?: () => void;
  helpArticleSlug?: string;
}

export default function ProcessingView({
  steps = DEFAULT_STEPS,
  currentStepIndex,
  statusMessage,
  startedAt,
  error,
  onRetry,
  helpArticleSlug = 'stuck-processing',
}: ProcessingViewProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startedAt || error) return;
    const tick = () => setElapsedMs(Date.now() - startedAt);
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt, error]);

  useEffect(() => {
    if (elapsedMs >= 60000) setShowSlowMessage(true);
  }, [elapsedMs]);

  const progressPercent = error
    ? 0
    : Math.min(98, Math.max(8, ((currentStepIndex + 0.35) / steps.length) * 100));

  const displayMessage =
    statusMessage && !statusMessage.startsWith('[Raw]')
      ? statusMessage
      : (steps[Math.min(currentStepIndex, steps.length - 1)]?.label ?? 'Processing…');

  if (error) {
    return (
      <div className="processing-view processing-view--error">
        <div className="processing-view-icon" aria-hidden="true">
          ⚠️
        </div>
        <h2 className="processing-view-title">Something went wrong</h2>
        <p className="processing-view-error">{error}</p>
        <HelpInlineLink slug={helpArticleSlug} label="Troubleshooting guide →" />
        {onRetry && (
          <button type="button" className="vesper-btn vesper-btn-primary shimmer-effect" onClick={onRetry}>
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="processing-view">
      <div className="processing-view-header">
        <p className="processing-view-eyebrow">Processing your sermon</p>
        <h2 className="processing-view-title">{displayMessage}</h2>
        {showSlowMessage && (
          <p className="processing-view-slow">
            This is taking a bit longer than usual — hang tight, your sermon is being analyzed.{' '}
            <HelpInlineLink slug="stuck-processing" label="Why is this taking so long?" className="help-inline-link help-inline-link--inline" />
          </p>
        )}
      </div>

      <div className="processing-view-card">
        <div className="processing-view-status-row">
          <span className="processing-view-status">{displayMessage}</span>
          <span className="processing-view-percent">{Math.round(progressPercent)}%</span>
        </div>

        <div
          className="processing-view-bar processing-view-bar--pulse"
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Processing progress"
        >
          <div className="processing-view-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        <ol className="processing-view-steps">
          {steps.map((step, i) => {
            const isDone = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            return (
              <li
                key={step.id}
                className={`processing-view-step${isDone ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}`}
              >
                <span className="processing-view-step-icon" aria-hidden="true">
                  {isDone ? '✓' : isCurrent ? '◐' : '○'}
                </span>
                <span>{step.label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="processing-view-hint">This usually takes 30–90 seconds. Please keep this window open.</p>
    </div>
  );
}
