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

/** Lazy clip poster for dashboard cards — YouTube img or captured frame from R2 upload. */
export default function ClipLibraryThumb({
  videoUrl,
  finalPath,
  clipStart,
  durationLabel,
}: ClipLibraryThumbProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [poster, setPoster] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const mediaSource = finalPath || videoUrl;
  const ytThumb = youtubeThumb(mediaSource) || youtubeThumb(videoUrl);

  useEffect(() => {
    if (ytThumb) return;

    const node = rootRef.current;
    if (!node || !mediaSource) return;

    let cancelled = false;

    const captureFromVideo = (src: string) => {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.src = src;

      const startSec = parseTime(clipStart);

      const capture = () => {
        if (cancelled || !video.videoWidth || !video.videoHeight) return;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setPoster(canvas.toDataURL('image/jpeg', 0.78));
          setLoading(false);
        } catch {
          if (!cancelled) {
            setFailed(true);
            setLoading(false);
          }
        }
      };

      video.addEventListener(
        'loadeddata',
        () => {
          if (startSec > 0 && Number.isFinite(video.duration)) {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              capture();
            };
            video.addEventListener('seeked', onSeeked);
            try {
              video.currentTime = Math.min(startSec, Math.max(video.duration - 0.1, 0));
            } catch {
              capture();
            }
          } else {
            capture();
          }
        },
        { once: true }
      );

      video.addEventListener(
        'error',
        () => {
          if (!cancelled) {
            setFailed(true);
            setLoading(false);
          }
        },
        { once: true }
      );
    };

    const loadPoster = () => {
      setLoading(true);
      setFailed(false);
      void resolveClientPlaybackUrl(mediaSource)
        .then((src) => {
          if (!cancelled) captureFromVideo(src);
        })
        .catch(() => {
          if (!cancelled) {
            setFailed(true);
            setLoading(false);
          }
        });
    };

    if (typeof IntersectionObserver === 'undefined') {
      loadPoster();
      return () => {
        cancelled = true;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          loadPoster();
        }
      },
      { rootMargin: '120px' }
    );

    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [mediaSource, clipStart, ytThumb, videoUrl]);

  return (
    <div ref={rootRef} className="clip-library-thumb">
      {ytThumb ? (
        <img src={ytThumb} alt="" />
      ) : poster ? (
        <img src={poster} alt="" />
      ) : (
        <span className="clip-library-thumb-fallback">{loading && !failed ? '…' : 'VESPER'}</span>
      )}
      <span className="clip-library-duration">{durationLabel}</span>
    </div>
  );
}
