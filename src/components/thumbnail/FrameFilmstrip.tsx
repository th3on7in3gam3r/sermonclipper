'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  formatTimecode,
  generateFilmstripFrames,
  pickBestFrames,
  type ThumbnailExportKey,
} from '@/lib/thumbnailFrames';
import { getThumbnailCaptureVideoUrl } from '@/lib/thumbnailVideoUrl';
import { resolveClientPlaybackUrl } from '@/lib/resolvePlaybackUrl';
import { isYouTubeUrl, needsMediaDeliveryResolve } from '@/lib/videoSource';

export type FilmstripFrame = { time: number; dataUrl: string; score: number };

interface FrameFilmstripProps {
  videoSrc: string;
  clipStart: number;
  clipEnd: number;
  selectedTime: number;
  onSelectTime: (time: number, dataUrl: string) => void;
}

async function resolveCaptureVideoSrc(raw: string): Promise<string> {
  const proxyUrl = getThumbnailCaptureVideoUrl(raw);
  if (proxyUrl) return proxyUrl;

  if (needsMediaDeliveryResolve(raw)) {
    return resolveClientPlaybackUrl(raw);
  }

  return raw;
}

export default function FrameFilmstrip({
  videoSrc,
  clipStart,
  clipEnd,
  selectedTime,
  onSelectTime,
}: FrameFilmstripProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelectTime);
  onSelectRef.current = onSelectTime;
  const [frames, setFrames] = useState<FilmstripFrame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bestTimes, setBestTimes] = useState<number[]>([]);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    if (isYouTubeUrl(videoSrc)) {
      setLoading(false);
      setError('Frame pick requires an uploaded video — YouTube sources use AI thumbnails.');
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setFrames([]);

      try {
        const src = await resolveCaptureVideoSrc(videoSrc);
        if (cancelled) return;

        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.src = src;

        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => resolve();
          video.onerror = () => reject(new Error('Video load failed'));
        });

        const end = clipEnd > clipStart ? clipEnd : clipStart + 30;
        const generated = await generateFilmstripFrames(video, clipStart, end, 1);
        if (cancelled) return;

        if (!generated.length) {
          setError('No frames could be captured from this clip.');
          setLoading(false);
          return;
        }

        setFrames(generated);
        setBestTimes(pickBestFrames(generated));
        onSelectRef.current(generated[0].time, generated[0].dataUrl);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError('Could not load video frames. Try again or use AI Styles.');
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [videoSrc, clipStart, clipEnd]);

  const pickFrameAtClientX = useCallback(
    (clientX: number) => {
      if (!stripRef.current || !frames.length) return;
      const rect = stripRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const idx = Math.round(ratio * (frames.length - 1));
      const frame = frames[idx];
      if (frame) onSelectTime(frame.time, frame.dataUrl);
    },
    [frames, onSelectTime]
  );

  const handleBestFrames = () => {
    if (!bestTimes.length || !frames.length) return;
    const match = frames.find((f) => f.time === bestTimes[0]);
    if (match) onSelectTime(match.time, match.dataUrl);
  };

  const selectedIdx = frames.findIndex((f) => Math.abs(f.time - selectedTime) < 0.5);

  return (
    <div className="thumb-filmstrip">
      <video ref={videoRef} style={{ display: 'none' }} preload="auto" crossOrigin="anonymous" />

      <div className="thumb-filmstrip-header">
        <span className="thumb-filmstrip-timecode">{formatTimecode(selectedTime)}</span>
        <button type="button" className="vesper-btn-outline thumb-best-btn" onClick={handleBestFrames}>
          Best Frames
        </button>
      </div>

      {loading ? (
        <p className="thumb-filmstrip-loading">Building frame strip…</p>
      ) : error ? (
        <p className="thumb-filmstrip-loading">{error}</p>
      ) : (
        <div
          ref={stripRef}
          className="thumb-filmstrip-track"
          onPointerDown={(e) => {
            setDragging(true);
            stripRef.current?.setPointerCapture(e.pointerId);
            pickFrameAtClientX(e.clientX);
          }}
          onPointerMove={(e) => {
            if (dragging) pickFrameAtClientX(e.clientX);
          }}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
        >
          {frames.map((frame) => (
            <button
              key={frame.time}
              type="button"
              className={`thumb-filmstrip-frame${bestTimes.includes(frame.time) ? ' thumb-filmstrip-frame--best' : ''}`}
              onClick={() => onSelectTime(frame.time, frame.dataUrl)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={frame.dataUrl} alt="" draggable={false} />
            </button>
          ))}
          {frames.length > 0 && (
            <div
              className="thumb-filmstrip-cursor"
              style={{
                left: `${((selectedIdx >= 0 ? selectedIdx : 0) / Math.max(frames.length - 1, 1)) * 100}%`,
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export type { ThumbnailExportKey };
