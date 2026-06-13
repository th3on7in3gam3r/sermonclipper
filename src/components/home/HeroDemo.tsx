'use client';

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
            <div className="hero-demo-waveform">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="hero-demo-bar" style={{ animationDelay: `${i * 0.09}s` }} />
              ))}
            </div>
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
            <div className="hero-demo-reel-bg" />
            <div className="hero-demo-scanline" />
            {CAPTIONS.map((caption, i) => (
              <div
                key={caption}
                className="hero-demo-caption"
                style={{ animationDelay: `${i * 2.4}s` }}
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
