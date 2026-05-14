'use client';

import { useState } from 'react';

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
        background: '#0D0D12',
        border: '1px solid rgba(139,92,246,0.25)',
        borderRadius: '28px',
        overflow: 'hidden',
        boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(139,92,246,0.1)',
        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Progress bar */}
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)' }}>
          <div style={{
            height: '100%',
            width: `${((step + 1) / SLIDES.length) * 100}%`,
            background: 'linear-gradient(90deg, #8B5CF6, #D8B4FE)',
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }} />
        </div>

        {/* Content */}
        <div style={{ padding: '40px 40px 32px' }}>
          {/* Icon + step counter */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px',
            }}>
              {current.icon}
            </div>
            <span style={{ fontSize: '10px', fontWeight: 900, color: '#52525B', letterSpacing: '0.15em' }}>
              {step + 1} / {SLIDES.length}
            </span>
          </div>

          {/* Title */}
          <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '16px', color: '#fff' }}>
            {current.title}
          </h2>

          {/* Body */}
          <p style={{ fontSize: '14px', color: '#A1A1AA', lineHeight: 1.7, marginBottom: '16px', whiteSpace: 'pre-line' }}>
            {current.body}
          </p>

          {/* Highlight */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px', borderRadius: '99px',
            background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
            marginBottom: '28px',
          }}>
            <span style={{ fontSize: '11px', color: '#C4B5FD', fontWeight: 700 }}>💡 {current.highlight}</span>
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

          {/* Step dots */}
          <div style={{ display: 'flex', gap: '5px', marginBottom: '24px' }}>
            {SLIDES.map((_, i) => (
              <div
                key={i}
                onClick={() => setStep(i)}
                style={{
                  width: i === step ? '20px' : '6px',
                  height: '6px', borderRadius: '99px', cursor: 'pointer',
                  background: i === step ? '#8B5CF6' : i < step ? '#10B981' : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{
                  flex: 1, padding: '14px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', color: '#A1A1AA', fontSize: '12px', fontWeight: 800,
                  cursor: 'pointer', letterSpacing: '0.08em',
                }}
              >
                ← BACK
              </button>
            )}
            <button
              onClick={isLast ? handleComplete : () => setStep(s => s + 1)}
              disabled={isLast && !acknowledged}
              className="shimmer-btn"
              style={{
                flex: 2, padding: '14px',
                borderRadius: '12px', fontSize: '12px', fontWeight: 900,
                letterSpacing: '0.1em',
                opacity: (isLast && !acknowledged) ? 0.4 : 1,
                cursor: (isLast && !acknowledged) ? 'not-allowed' : 'pointer',
              }}
            >
              {isLast ? 'GET STARTED ✦' : 'NEXT →'}
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

  // Check on mount (client-side only)
  if (typeof window !== 'undefined') {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen && !needsOnboarding) {
      // Use setTimeout to avoid setState during render
      setTimeout(() => setNeedsOnboarding(true), 0);
    }
  }

  return { needsOnboarding, setNeedsOnboarding };
}
