'use client';

interface HeroYouTubeInputProps {
  isMobile: boolean;
  url: string;
  error?: string | null;
  isValidating?: boolean;
  onUrlChange: (url: string) => void;
  onSubmit: () => void;
}

export default function HeroYouTubeInput({
  isMobile,
  url,
  error,
  isValidating,
  onUrlChange,
  onSubmit,
}: HeroYouTubeInputProps) {
  const inputErrorId = 'youtube-url-error';

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
            type="url"
            inputMode="url"
            placeholder="https://youtube.com/watch?v=…"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isValidating && onSubmit()}
            className={`hero-youtube-input${error ? ' hero-youtube-input--error' : ''}`}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? inputErrorId : undefined}
          />
          <button
            type="button"
            onClick={onSubmit}
            disabled={isValidating || !url.trim()}
            className="vesper-btn vesper-btn-outline shimmer-effect hero-youtube-btn"
          >
            {isValidating ? 'Checking…' : 'Analyze from YouTube'}
          </button>
        </div>
        {error ? (
          <p id={inputErrorId} className="hero-youtube-error" role="alert">
            {error}
          </p>
        ) : (
          <p className="hero-youtube-hint">
            Preview and clip discovery only — upload a video file above to export rendered reels.
          </p>
        )}
      </div>
    </div>
  );
}
