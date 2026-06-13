'use client';

interface HeroYouTubeInputProps {
  isMobile: boolean;
  url: string;
  onUrlChange: (url: string) => void;
  onSubmit: () => void;
}

export default function HeroYouTubeInput({
  isMobile,
  url,
  onUrlChange,
  onSubmit,
}: HeroYouTubeInputProps) {
  return (
    <div className="hero-youtube-section">
      <div className="hero-youtube-divider" aria-hidden="true">
        <span className="hero-youtube-divider-line" />
        <span className="hero-youtube-divider-label">OR</span>
        <span className="hero-youtube-divider-line" />
      </div>

      <div className="hero-youtube-card glass-card">
        <label htmlFor="youtube-url-input" className="hero-youtube-label">
          Paste YouTube Link
        </label>
        <div className={`hero-youtube-row${isMobile ? ' hero-youtube-row--stack' : ''}`}>
          <input
            id="youtube-url-input"
            type="text"
            placeholder="https://youtube.com/watch?v=…"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            className="hero-youtube-input"
          />
          <button
            type="button"
            onClick={onSubmit}
            className="vesper-btn vesper-btn-outline shimmer-effect hero-youtube-btn"
          >
            Analyze from YouTube
          </button>
        </div>
        <p className="hero-youtube-hint">
          Preview and clip discovery only — upload a video file above to export rendered reels.
        </p>
      </div>
    </div>
  );
}
