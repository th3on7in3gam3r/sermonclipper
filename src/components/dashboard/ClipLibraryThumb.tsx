'use client';

import { useEffect, useRef, useState } from 'react';
import { resolveClientPlaybackUrl } from '@/lib/resolvePlaybackUrl';
import { extractYouTubeVideoId, isYouTubeUrl } from '@/lib/videoSource';
import { parseTime } from '@/lib/parseTime';

type ClipLibraryThumbProps = {
  videoUrl: string;
  finalPath?: string;
  clipStart?: string | number;
  durationLabel: string;
};

function youtubeThumb(url: string): string | null {
  if (!isYouTubeUrl(url)) return null;
  const id = extractYouTubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

/** Lazy clip poster for dashboard cards — YouTube img or inline video frame from R2 upload. */
export default function ClipLibraryThumb({
  videoUrl,
  finalPath,
  clipStart,
  durationLabel,
}: ClipLibraryThumbProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playableSrc, setPlayableSrc] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const mediaSource = finalPath || videoUrl;
  const ytThumb = youtubeThumb(mediaSource) || youtubeThumb(videoUrl);
  const startSec = parseTime(clipStart);

  useEffect(() => {
    if (ytThumb) return;

    const node = rootRef.current;
    if (!node || !mediaSource) return;

    let cancelled = false;

    const loadSrc = () => {
      setLoading(true);
      setFailed(false);
      setReady(false);
      void resolveClientPlaybackUrl(mediaSource)
        .then((src) => {
          if (!cancelled) setPlayableSrc(src);
        })
        .catch(() => {
          if (!cancelled) {
            setFailed(true);
            setLoading(false);
          }
        });
    };

    if (typeof IntersectionObserver === 'undefined') {
      loadSrc();
      return () => {
        cancelled = true;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          loadSrc();
        }
      },
      { rootMargin: '120px' }
    );

    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [mediaSource, ytThumb, videoUrl]);

  const seekToClipStart = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    try {
      if (startSec > 0) {
        video.currentTime = Math.min(startSec, Math.max(video.duration - 0.1, 0));
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div ref={rootRef} className="clip-library-thumb">
      {ytThumb ? (
        <img src={ytThumb} alt="" />
      ) : playableSrc ? (
        <video
          ref={videoRef}
          key={playableSrc}
          className={`clip-library-thumb-video${ready ? ' clip-library-thumb-video--ready' : ''}`}
          src={playableSrc}
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={seekToClipStart}
          onLoadedData={() => {
            seekToClipStart();
            setReady(true);
            setLoading(false);
          }}
          onError={() => {
            setFailed(true);
            setLoading(false);
            setReady(false);
          }}
        />
      ) : null}
      {!ytThumb && !ready && (
        <span className="clip-library-thumb-fallback">{loading && !failed ? '…' : 'VESPER'}</span>
      )}
      <span className="clip-library-duration">{durationLabel}</span>
    </div>
  );
}
