'use client';

import HeroDemoVideo from '@/components/home/HeroDemoVideo';

// TODO: Replace with real full-sermon footage (15–20s clip) when available.
const DEMO_SERMON_SRC = '/demo/sermon-before.mp4';
// TODO: Replace with a real Vesper-exported 9:16 reel when available.
const DEMO_REEL_SRC = '/demo/reel-after.mp4';

const CAPTIONS = [
  'Your breakthrough is closer than you think.',
  'God is still writing your story.',
  'Walk by faith, not by sight.',
];

export default function HeroDemo() {
  return (
    <div className="hero-demo-shell glass-card premium-border animate-in">
      <div className="hero-demo-row">
        <div className="hero-demo-before-wrap">
          <div className="hero-demo-label hero-demo-label--muted">Before · Full sermon</div>
          <div className="hero-demo-before">
            <HeroDemoVideo
              src={DEMO_SERMON_SRC}
              className="hero-demo-video--before"
              controlClassName="hero-demo-video-control--before"
              ariaLabel="full sermon preview video"
            />
            <div className="hero-demo-before-caption">
              <span>45:00 sermon · single platform</span>
            </div>
          </div>
        </div>

        <div className="hero-demo-arrow" aria-hidden>
          →
        </div>

        <div className="hero-demo-after-wrap">
          <div className="hero-demo-label hero-demo-label--accent">After · Cinematic reel</div>
          <div className="hero-demo-phone">
            <HeroDemoVideo
              src={DEMO_REEL_SRC}
              className="hero-demo-video--after"
              ariaLabel="cinematic reel preview video"
            />
            <div className="hero-demo-scanline" aria-hidden="true" />
            {CAPTIONS.map((caption, i) => (
              <div
                key={caption}
                className="hero-demo-caption"
                style={{ animationDelay: `${i * 2.4}s` }}
                aria-hidden="true"
              >
                {caption}
              </div>
            ))}
            <div className="hero-demo-phone-meta">
              <span>9:16</span>
              <span className="vesper-badge badge-violet hero-demo-reel-badge">REEL</span>
            </div>
          </div>
        </div>
      </div>

      <p className="hero-demo-footnote">
        Vesper finds the moment, styles the caption, and exports a vertical reel — automatically.
      </p>
    </div>
  );
}
