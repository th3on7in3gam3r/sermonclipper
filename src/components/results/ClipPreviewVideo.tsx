'use client';

import { useEffect, useRef, useState } from 'react';
import { formatTime, parseTime } from '@/lib/parseTime';

type ClipPreviewVideoProps = {
  src: string;
  start?: unknown;
  end?: unknown;
};

/** In-browser clip preview with seek-to-start and a captured poster frame. */
export default function ClipPreviewVideo({ src, start, end }: ClipPreviewVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [poster, setPoster] = useState<string>();
  const [error, setError] = useState(false);
  const startSec = parseTime(start);

  useEffect(() => {
    setPoster(undefined);
    setError(false);
  }, [src, startSec]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    let cancelled = false;

    const capturePoster = () => {
      if (cancelled || !vid.videoWidth || !vid.videoHeight) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = vid.videoWidth;
        canvas.height = vid.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        setPoster(canvas.toDataURL('image/jpeg', 0.82));
      } catch {
        /* canvas taint — ignore */
      }
    };

    const seekToClipStart = () => {
      if (startSec <= 0) {
        capturePoster();
        return;
      }
      const onSeeked = () => {
        vid.removeEventListener('seeked', onSeeked);
        capturePoster();
      };
      vid.addEventListener('seeked', onSeeked);
      try {
        vid.currentTime = Math.min(startSec, Math.max(vid.duration - 0.1, 0));
      } catch {
        capturePoster();
      }
    };

    const onLoadedData = () => seekToClipStart();
    const onError = () => setError(true);

    vid.addEventListener('loadeddata', onLoadedData);
    vid.addEventListener('error', onError);

    if (vid.readyState >= 2) onLoadedData();

    return () => {
      cancelled = true;
      vid.removeEventListener('loadeddata', onLoadedData);
      vid.removeEventListener('error', onError);
    };
  }, [src, startSec]);

  if (error) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#71717A',
          fontSize: '13px',
          fontWeight: 700,
          padding: '16px',
          textAlign: 'center',
        }}
      >
        Preview unavailable — open Customize Reel to preview this clip.
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      controls
      preload="metadata"
      playsInline
      style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
    />
  );
}

export function clipDurationLabel(start: unknown, end: unknown): string {
  const startSec = parseTime(start);
  const endSec = parseTime(end);
  if (endSec > startSec) {
    return `${formatTime(startSec)} – ${formatTime(endSec)}`;
  }
  return formatTime(0);
}

export function clipLengthSeconds(start: unknown, end: unknown): number {
  const startSec = parseTime(start);
  const endSec = parseTime(end);
  return Math.max(endSec - startSec, 0);
}
