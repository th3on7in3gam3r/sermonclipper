'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  formatTimecode,
  generateFilmstripFrames,
  pickBestFrames,
  type ThumbnailExportKey,
} from '@/lib/thumbnailFrames';

export type FilmstripFrame = { time: number; dataUrl: string; score: number };

interface FrameFilmstripProps {
  videoSrc: string;
  clipStart: number;
  clipEnd: number;
  selectedTime: number;
  onSelectTime: (time: number, dataUrl: string) => void;
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
  const [bestTimes, setBestTimes] = useState<number[]>([]);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      video.src = videoSrc;
      video.muted = true;
      video.playsInline = true;
      if (videoSrc.startsWith('/')) {
        video.crossOrigin = 'anonymous';
      } else {
        video.removeAttribute('crossorigin');
      }

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Video load failed'));
      });

      const generated = await generateFilmstripFrames(video, clipStart, clipEnd, 1);
      if (cancelled) return;

      setFrames(generated);
      setBestTimes(pickBestFrames(generated));
      if (generated[0]) onSelectRef.current(generated[0].time, generated[0].dataUrl);
      setLoading(false);
    };

    load().catch(() => {
      if (!cancelled) setLoading(false);
    });

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
      <video ref={videoRef} style={{ display: 'none' }} preload="auto" />

      <div className="thumb-filmstrip-header">
        <span className="thumb-filmstrip-timecode">{formatTimecode(selectedTime)}</span>
        <button type="button" className="vesper-btn-outline thumb-best-btn" onClick={handleBestFrames}>
          Best Frames
        </button>
      </div>

      {loading ? (
        <p className="thumb-filmstrip-loading">Building frame strip…</p>
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
