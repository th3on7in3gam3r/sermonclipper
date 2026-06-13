'use client';

import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'vesper-onboarding-v2-acknowledged';

const SLIDES = [
  {
    icon: '🎬',
    title: 'Welcome to Vesper Studio',
    body: 'Vesper transforms your sermons into professional short-form content for social media. Here\'s how it works in 4 simple steps.',
    highlight: 'Let\'s get you started.',
  },
  {
    icon: '📤',
    title: 'Step 1: Upload or Paste',
    body: 'You have two options:\n\n• Upload an MP4 file directly (max 100MB — recommended for full export)\n• Paste a YouTube link (AI analysis only — no reel export)\n\nFor large sermons, compress to 720p MP4 first or use a YouTube link.',
    highlight: 'Upload MP4 for the complete experience.',
  },
  {
    icon: '🧠',
    title: 'Step 2: AI Analysis',
    body: 'Our GPT-4o engine watches your entire sermon and identifies the most impactful moments — powerful quotes, emotional peaks, and theological highlights. This takes about 60 seconds.',
    highlight: 'You\'ll get 8-12 clips automatically.',
  },
  {
    icon: '🎛',
    title: 'Step 3: Customize in Studio',
    body: 'Click "Customize Reel" on any clip to open the Studio. Choose caption styles, color filters, fonts, and animations. The live preview shows exactly what your final reel will look like.',
    highlight: 'Everything updates in real-time.',
  },
  {
    icon: '🚀',
    title: 'Step 4: Export & Share',
    body: 'Hit "Confirm & Export" to render your 9:16 vertical reel in the cloud. Download it and post directly to Instagram Reels, TikTok, YouTube Shorts, or any platform.',
    highlight: 'Rendering takes 1-3 minutes.',
  },
  {
    icon: '⚠️',
    title: 'Important: YouTube Limitation',
    body: 'If you paste a YouTube link, the AI analysis works perfectly — but reel export is disabled. YouTube blocks direct file access from servers.\n\nTo get exportable reels: download the sermon from YouTube, then re-upload the MP4 file to Vesper.',
    highlight: 'Upload MP4 = Full power. YouTube = Preview only.',
  },
];

interface OnboardingModalProps {
  onComplete: () => void;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);

  const isLast = step === SLIDES.length - 1;
  const current = SLIDES[step];
  const totalSteps = SLIDES.length;

  const handleComplete = () => {
    if (!acknowledged) return;
    localStorage.setItem(ONBOARDING_KEY, '1');
    onComplete();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        width: '100%', maxWidth: '540px',
        background: '#1A1A24',
        border: '1px solid rgba(139,92,246,0.4)',
        borderRadius: '28px',
        overflow: 'hidden',
        boxShadow: '0 0 0 1px rgba(139,92,246,0.2), 0 40px 120px rgba(0,0,0,0.8), 0 0 80px rgba(139,92,246,0.15)',
        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Content */}
        <div style={{ padding: '32px 32px 28px' }}>
          {/* Labeled step bar */}
          <div
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-label={`Step ${step + 1} of ${totalSteps}`}
            style={{ marginBottom: '28px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
              <span style={{ fontSize: '15px', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
                Step {step + 1} of {totalSteps}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#A78BFA' }}>
                {Math.round(((step + 1) / totalSteps) * 100)}% complete
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${totalSteps}, 1fr)`,
                gap: '6px',
                marginBottom: '10px',
              }}
            >
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStep(i)}
                  aria-label={`Go to step ${i + 1}`}
                  aria-current={i === step ? 'step' : undefined}
                  style={{
                    height: '10px',
                    borderRadius: '99px',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    background:
                      i < step ? '#10B981' : i === step ? '#8B5CF6' : 'rgba(255,255,255,0.12)',
                    boxShadow: i === step ? '0 0 12px rgba(139,92,246,0.5)' : 'none',
                    transition: 'background 0.25s, box-shadow 0.25s',
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
              {SLIDES.map((slide, i) => (
                <button
                  key={slide.title}
                  type="button"
                  onClick={() => setStep(i)}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    padding: '4px 2px',
                    cursor: 'pointer',
                    fontSize: '9px',
                    fontWeight: i === step ? 800 : 600,
                    color: i === step ? '#E9D5FF' : i < step ? '#6EE7B7' : '#71717A',
                    lineHeight: 1.2,
                    textAlign: 'center',
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Icon */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px',
            }}>
              {current.icon}
            </div>
          </div>

          {/* Title */}
          <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '16px', color: '#fff' }}>
            {current.title}
          </h2>

          {/* Body */}
          <p style={{ fontSize: '14px', color: '#D4D4D8', lineHeight: 1.7, marginBottom: '16px', whiteSpace: 'pre-line' }}>
            {current.body}
          </p>

          {/* Highlight */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px', borderRadius: '99px',
            background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)',
            marginBottom: '28px',
          }}>
            <span style={{ fontSize: '11px', color: '#E9D5FF', fontWeight: 700 }}>💡 {current.highlight}</span>
          </div>

          {/* Acknowledgment checkbox on last slide */}
          {isLast && (
            <div
              onClick={() => setAcknowledged(!acknowledged)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '16px', borderRadius: '14px', cursor: 'pointer',
                background: acknowledged ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
                border: acknowledged ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
                marginBottom: '24px', transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                border: acknowledged ? '2px solid #10B981' : '2px solid #52525B',
                background: acknowledged ? '#10B981' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                {acknowledged && <span style={{ color: '#fff', fontSize: '12px', fontWeight: 900 }}>✓</span>}
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#fff', fontWeight: 700, marginBottom: '4px' }}>
                  I understand how Vesper works
                </p>
                <p style={{ fontSize: '11px', color: '#71717A', lineHeight: 1.5 }}>
                  I acknowledge that YouTube links provide AI analysis only, and full reel export requires uploading an MP4 file directly.
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                style={{
                  flex: 1, padding: '14px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', color: '#A1A1AA', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={isLast ? handleComplete : () => setStep((s) => s + 1)}
              disabled={isLast && !acknowledged}
              className="shimmer-btn"
              style={{
                flex: 2, padding: '14px',
                borderRadius: '12px', fontSize: '13px', fontWeight: 900,
                letterSpacing: '0.06em',
                opacity: (isLast && !acknowledged) ? 0.4 : 1,
                cursor: (isLast && !acknowledged) ? 'not-allowed' : 'pointer',
              }}
            >
              {isLast ? 'GET STARTED ✦' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Hook to check if onboarding has been completed */
export function useOnboarding() {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    setNeedsOnboarding(!seen);
  }, []);

  return { needsOnboarding, setNeedsOnboarding };
}
