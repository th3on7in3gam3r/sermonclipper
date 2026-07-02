'use client';

import { useEffect, useState } from 'react';
import { YOUTUBE_PREVIEW_ONLY_NOTE } from '@/content/prepareSermonFile';

interface HeroYouTubeInputProps {
  isMobile: boolean;
  url: string;
  error?: string | null;
  notice?: string | null;
  isValidating?: boolean;
  onUrlChange: (url: string) => void;
  onSubmit: () => void;
  embedded?: boolean;
}

type RecentStream = { videoId: string; title: string; url: string; publishedAt?: string };

export default function HeroYouTubeInput({
  isMobile,
  url,
  error,
  notice,
  isValidating,
  onUrlChange,
  onSubmit,
  embedded = false,
}: HeroYouTubeInputProps) {
  const [recentStreams, setRecentStreams] = useState<RecentStream[]>([]);
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const inputErrorId = 'youtube-url-error';

  useEffect(() => {
    fetch('/api/youtube/recent-streams')
      .then((r) => r.json())
      .then((d) => {
        setRecentStreams(d.streams || []);
        setYoutubeConnected(Boolean(d.connected));
      })
      .catch(() => {});
  }, []);

  const body = (
    <>
      <label htmlFor="youtube-url-input" className="hero-youtube-label">
        Paste YouTube link
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
          {isValidating ? 'Checking…' : 'Analyze sermon'}
        </button>
      </div>

      {youtubeConnected && recentStreams.length > 0 && (
        <div className="hero-youtube-recent">
          <p className="hero-youtube-recent-label">Recent streams</p>
          <div className="hero-youtube-recent-list">
            {recentStreams.map((stream) => (
              <button
                key={stream.videoId}
                type="button"
                className="hero-youtube-recent-item"
                onClick={() => onUrlChange(stream.url)}
              >
                {stream.title || stream.videoId}
              </button>
            ))}
          </div>
        </div>
      )}

      {notice && !error && (
        <p className="hero-youtube-notice" role="status">
          {notice}
        </p>
      )}
      {error ? (
        <p id={inputErrorId} className="hero-youtube-error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <div className="hero-youtube-embedded">
        <p className="hero-youtube-preview-banner">{YOUTUBE_PREVIEW_ONLY_NOTE}</p>
        {body}
      </div>
    );
  }

  return (
    <div className="hero-youtube-section">
      <div className="hero-youtube-divider" aria-hidden="true">
        <span className="hero-youtube-divider-line" />
        <span className="hero-youtube-divider-label">OR</span>
        <span className="hero-youtube-divider-line" />
      </div>

      <div className="hero-youtube-card glass-card">
        {body}
        {!notice && !error && (
          <p className="hero-youtube-hint">
            Preview and clip discovery — upload a video or audio file above to export rendered reels.
          </p>
        )}
      </div>
    </div>
  );
}
