// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StudioCaptionMotion from './StudioCaptionMotion';

describe('StudioCaptionMotion', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('plays the chosen entrance on the whole line', () => {
    render(<StudioCaptionMotion text="He ran to you" entrance="zoom" captionStyle="slideUp" style={{}} />);
    const el = screen.getByTestId('studio-caption-motion');
    expect(el.className).toContain('animate-studio-zoom');
    expect(el.textContent).toBe('He ran to you');
  });

  it('brings word-by-word captions in one word at a time with the same entrance', () => {
    vi.useFakeTimers();
    render(<StudioCaptionMotion text="He ran to you" entrance="carve" captionStyle="wordPop" style={{}} />);
    expect(screen.getByTestId('studio-caption-motion').textContent).toBe('He');
    act(() => vi.advanceTimersByTime(520));
    const el = screen.getByTestId('studio-caption-motion');
    expect(el.textContent).toBe('ran');
    expect(el.className).toContain('animate-studio-carve');
  });
});
