/**
 * How burned-in text moves in an export. Two studio settings combine:
 * - "How the text appears" (Style) picks the entrance: fade, slide up, zoom, carve.
 * - The caption animation (Caption) picks the rhythm: whole lines, or word by word.
 * Values must be Shotstack transition names.
 */
import { CAPTION_ANIMATION_MAP } from './exportOptions';

export const ENTRANCE_TRANSITIONS: Record<string, string> = {
  fade: 'fade',
  slideUp: 'slideUp',
  zoom: 'zoom',
  carve: 'reveal',
};

/** Caption animations that show one word at a time. */
export const WORD_BY_WORD = new Set(['wordPop', 'typewriter', 'highlight']);

export function captionTransition(animation: string | undefined, captionAnimation: string): { in: string; out: string } {
  const rhythm = CAPTION_ANIMATION_MAP[captionAnimation] || CAPTION_ANIMATION_MAP.slideUp;
  const entrance = (animation && ENTRANCE_TRANSITIONS[animation]) || rhythm.in;
  // Word-by-word captions swap quickly, so a fade out reads cleaner than a second slide.
  const out = WORD_BY_WORD.has(captionAnimation) ? 'fade' : rhythm.out === 'slideUp' ? 'fade' : rhythm.out;
  return { in: entrance, out };
}
