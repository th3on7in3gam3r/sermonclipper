'use client';

import type { CSSProperties } from 'react';
import { formatTime } from '@/lib/parseTime';
import { SUGGESTED_MAX_SECONDS } from '@/lib/studio/studioLogic';

type Props = {
  start: number;
  end: number;
  window: { min: number; max: number };
  duration: number;
  isOriginal: boolean;
  onStart: (seconds: number) => void;
  onEnd: (seconds: number) => void;
  onReset: () => void;
};

/**
 * One track, two handles. Each handle is a native range input layered on the
 * same track, so both work with the keyboard and announce their time.
 */
export default function StudioTrimBar({ start, end, window, duration, isOriginal, onStart, onEnd, onReset }: Props) {
  const span = Math.max(window.max - window.min, 1);
  const pct = (v: number) => ((v - window.min) / span) * 100;
  const long = duration > SUGGESTED_MAX_SECONDS;
  // With the handles close together, keep whichever one the user can reach on top.
  const startOnTop = start - window.min > span / 2;

  return (
    <div
      className="studio-trim"
      style={{ '--trim-from': `${pct(start)}%`, '--trim-to': `${pct(end)}%` } as CSSProperties}
    >
      <div className="studio-trim-head">
        <span className="studio-trim-title">Trim</span>
        <span className="studio-trim-times">
          {formatTime(start)}–{formatTime(end)}{' '}
          <strong>{duration}s</strong>
        </span>
        {!isOriginal && (
          <button type="button" className="studio-link-btn studio-trim-reset" onClick={onReset}>
            Reset
          </button>
        )}
      </div>

      <div className="studio-trim-track">
        <div className="studio-trim-range" aria-hidden />
        <input
          type="range"
          aria-label="Clip start"
          aria-valuetext={formatTime(start)}
          style={{ zIndex: startOnTop ? 3 : 2 }}
          min={window.min}
          max={window.max}
          step={1}
          value={start}
          onChange={(e) => onStart(Number(e.target.value))}
        />
        <input
          type="range"
          aria-label="Clip end"
          aria-valuetext={formatTime(end)}
          style={{ zIndex: startOnTop ? 2 : 3 }}
          min={window.min}
          max={window.max}
          step={1}
          value={end}
          onChange={(e) => onEnd(Number(e.target.value))}
        />
      </div>

      <div className="studio-trim-scale" aria-hidden>
        <span>{formatTime(window.min)}</span>
        <span>{formatTime(window.max)}</span>
      </div>

      {long && (
        <p className="studio-trim-note" role="status">
          This reel is over a minute. Most short-form reels run under 60 seconds.
        </p>
      )}
    </div>
  );
}
