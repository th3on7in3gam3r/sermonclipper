'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { clampTrim, trimWindow } from '@/lib/studio/studioLogic';

const PREVIEW_DEBOUNCE_MS = 350;

/**
 * Trim handles plus the range the preview plays. The preview follows the
 * handles after a short pause, so dragging and keyboard arrows both update it
 * without re-seeking the video on every step.
 */
export function useTrim(clipStart: number, clipEnd: number, sourceDuration?: number | null) {
  const window = useMemo(() => trimWindow(clipStart, clipEnd, sourceDuration), [clipStart, clipEnd, sourceDuration]);
  const [rawTrim, setTrim] = useState({ start: clipStart, end: clipEnd });
  // Once the video's real length is known, the handles can't sit past its end.
  const trim = useMemo(() => clampTrim(rawTrim, window, 'end'), [rawTrim, window]);
  const [preview, setPreview] = useState({ start: clipStart, end: clipEnd });

  useEffect(() => {
    const t = setTimeout(() => setPreview(trim), PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [trim]);

  const setStart = useCallback(
    (start: number) => setTrim((prev) => clampTrim({ start, end: prev.end }, window, 'start')),
    [window]
  );
  const setEnd = useCallback(
    (end: number) => setTrim((prev) => clampTrim({ start: prev.start, end }, window, 'end')),
    [window]
  );
  const reset = useCallback(() => setTrim({ start: clipStart, end: clipEnd }), [clipStart, clipEnd]);

  /** Jump the preview to a moment (e.g. a quotable line) without moving the trim handles. */
  const previewFrom = useCallback(
    (seconds: number) => setPreview({ start: seconds, end: Math.max(seconds + 15, clipEnd) }),
    [clipEnd]
  );

  return {
    trim,
    preview,
    window,
    duration: trim.end - trim.start,
    isOriginal: trim.start === clipStart && trim.end === clipEnd,
    setStart,
    setEnd,
    reset,
    previewFrom,
  };
}
