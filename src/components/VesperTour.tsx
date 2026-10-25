'use client';

import { useState, useEffect } from 'react';

const TOUR_KEY = 'vesper-tour-v1-seen';

const STEPS = [
  {
    icon: '🎬',
    tag: 'STEP 1 OF 5',
    title: 'Your Sermon, Analysed',
    body: 'Vesper uses Gemini AI to scan your full sermon and automatically extract the most powerful, shareable moments — so you never have to scrub through footage manually.',
    tip: 'Works with YouTube links or uploaded video files.',
  },
  {
    icon: '🃏',
    tag: 'STEP 2 OF 5',
    title: 'Your clips',
    body: 'Each clip card shows the moment’s title, its key quote and a suggested caption. Use Thumbnail to design a cover image, or Edit reel to open Vesper Studio.',
    tip: 'Thumbnails use DALL-E 3 via a secure backend proxy.',
  },
  {
    icon: '🎛',
    tag: 'STEP 3 OF 5',
    title: 'Vesper Studio',
    body: 'Edit on the left (Style, Captions, Audio and Branding), watch the 9:16 preview in the middle, and trim the clip with the bar under it. Every change shows up in the preview right away.',
    tip: 'What you see in the preview is what the exported reel looks like.',
  },
  {
    icon: '📱',
    tag: 'STEP 4 OF 5',
    title: 'Post captions',
    body: "On the right, pick TikTok, Instagram, YouTube or X to get a post caption sized for that platform, with a character count. Red means it's too long for that platform.",
    tip: "Captions are pre-filled by AI from the clip's hook title and scripture.",
  },
  {
    icon: '🚀',
    tag: 'STEP 5 OF 5',
    title: 'Export your reel',
    body: 'Use Export reel at the top of the studio. Your 9:16 reel, with captions, color and branding built in, is usually ready to download in a minute or two.',
    tip: 'The Thumbnail Studio also lets you download a 16:9 billboard asset for YouTube.',
  },
];

interface VesperTourProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function VesperTour({ forceOpen, onClose }: VesperTourProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      Promise.resolve().then(() => {
        setStep(0);
        setVisible(true);
      });
      return;
    }
    const seen = localStorage.getItem(TOUR_KEY);
    if (!seen) {
      // Small delay so the results page finishes mounting first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [forceOpen]);

  const close = () => {
    localStorage.setItem(TOUR_KEY, '1');
    setVisible(false);
    onClose?.();
  };

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--surface)',
          border: '1px solid rgb(var(--primary-rgb) / 0.3)',
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgb(var(--primary-rgb) / 0.1)',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Progress bar */}
        <div style={{ height: '3px', background: 'rgb(var(--fg-rgb) / 0.05)' }}>
          <div
            style={{
              height: '100%',
              width: `${((step + 1) / STEPS.length) * 100}%`,
              background: 'linear-gradient(90deg, var(--primary), var(--primary-soft))',
              transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: '40px 40px 32px' }}>
          {/* Icon + tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: 'rgb(var(--primary-rgb) / 0.1)',
                border: '1px solid rgb(var(--primary-rgb) / 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0,
              }}
            >
              {current.icon}
            </div>
            <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.2em' }}>
              {current.tag}
            </div>
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: '26px',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              marginBottom: '16px',
              color: 'var(--text-main)',
            }}
          >
            {current.title}
          </h2>

          {/* Body */}
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-muted)',
              lineHeight: 1.7,
              marginBottom: '20px',
            }}
          >
            {current.body}
          </p>

          {/* Tip pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '99px',
              background: 'rgb(var(--accent-rgb) / 0.06)',
              border: '1px solid rgb(var(--accent-rgb) / 0.15)',
              marginBottom: '32px',
            }}
          >
            <span style={{ fontSize: '12px' }}>💡</span>
            <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>{current.tip}</span>
          </div>

          {/* Step dots */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                onClick={() => setStep(i)}
                style={{
                  width: i === step ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '99px',
                  cursor: 'pointer',
                  background: i === step ? 'var(--primary)' : 'rgb(var(--fg-rgb) / 0.1)',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'rgb(var(--fg-rgb) / 0.04)',
                  border: '1px solid rgb(var(--fg-rgb) / 0.1)',
                  borderRadius: '14px',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  letterSpacing: '0.08em',
                }}
              >
                ← BACK
              </button>
            )}
            <button
              onClick={isLast ? close : () => setStep((s) => s + 1)}
              style={{
                flex: 2,
                padding: '14px',
                background: 'linear-gradient(90deg, var(--primary), var(--primary-soft), var(--primary))',
                backgroundSize: '200% auto',
                animation: 'shimmer 4s linear infinite',
                border: 'none',
                borderRadius: '14px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 900,
                cursor: 'pointer',
                letterSpacing: '0.12em',
              }}
            >
              {isLast ? 'START CREATING ✦' : 'NEXT →'}
            </button>
            {!isLast && (
              <button
                onClick={close}
                style={{
                  padding: '14px 16px',
                  background: 'none',
                  border: '1px solid rgb(var(--fg-rgb) / 0.06)',
                  borderRadius: '14px',
                  color: 'var(--text-dim)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                SKIP
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
