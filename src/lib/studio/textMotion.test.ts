import { describe, expect, it } from 'vitest';
import { captionTransition, ENTRANCE_TRANSITIONS } from './textMotion';

describe('captionTransition', () => {
  it('uses "How the text appears" as the entrance for every caption style', () => {
    for (const cap of ['slideUp', 'wordPop', 'typewriter', 'highlight', 'scalePulse']) {
      expect(captionTransition('zoom', cap).in).toBe('zoom');
      expect(captionTransition('carve', cap).in).toBe('reveal');
      expect(captionTransition('fade', cap).in).toBe('fade');
    }
  });

  it('falls back to the caption style when no entrance is chosen', () => {
    expect(captionTransition(undefined, 'scalePulse').in).toBe('zoom');
    expect(captionTransition('unknown', 'slideUp').in).toBe('slideUp');
  });

  it('only emits Shotstack transition names', () => {
    const valid = new Set(['fade', 'slideUp', 'zoom', 'wipeRight', 'reveal', 'slideDown', 'wipeLeft']);
    Object.values(ENTRANCE_TRANSITIONS).forEach((t) => expect(valid.has(t)).toBe(true));
    expect(valid.has(captionTransition('slideUp', 'wordPop').out)).toBe(true);
  });
});
