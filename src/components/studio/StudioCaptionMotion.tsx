'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { STUDIO_ANIMATIONS } from '@/lib/studio/constants';
import { WORD_BY_WORD } from '@/lib/studio/textMotion';

/** How long each beat lasts in the preview: a whole line, or a single word. */
const LINE_BEAT_MS = 2600;
const WORD_BEAT_MS = 520;

/**
 * Plays the caption the way the export will: each line (or each word, for
 * word-by-word styles) comes in with the chosen "How the text appears" effect.
 * It repeats so the effect is easy to judge; the export plays it once per line or word.
 */
export default function StudioCaptionMotion({
  text,
  entrance,
  captionStyle,
  style,
}: {
  text: string;
  entrance: string;
  captionStyle: string;
  style: CSSProperties;
}) {
  const wordByWord = WORD_BY_WORD.has(captionStyle);
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setBeat((b) => b + 1), wordByWord ? WORD_BEAT_MS : LINE_BEAT_MS);
    return () => clearInterval(id);
  }, [wordByWord, entrance, text]);

  const entranceClass = STUDIO_ANIMATIONS.find((a) => a.id === entrance)?.class ?? 'animate-studio-fade';
  const shown = wordByWord && words.length > 0 ? words[beat % words.length] : text;
  const glow = captionStyle === 'highlight' ? { textShadow: '0 0 14px currentColor' } : null;

  return (
    <div
      // A new key restarts the entrance on every beat and whenever a setting changes.
      key={`${entrance}-${captionStyle}-${beat}`}
      className={`${entranceClass}${wordByWord ? ' studio-entrance-quick' : ''}`}
      style={{ ...style, ...glow, display: 'inline-block', width: '100%' }}
      data-testid="studio-caption-motion"
    >
      {shown}
    </div>
  );
}
