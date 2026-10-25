// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTrim } from './useTrim';

describe('useTrim', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('starts on the clip and reports its length', () => {
    const { result } = renderHook(() => useTrim(65, 102));
    expect(result.current.trim).toEqual({ start: 65, end: 102 });
    expect(result.current.duration).toBe(37);
    expect(result.current.isOriginal).toBe(true);
    expect(result.current.window).toEqual({ min: 5, max: 162 });
  });

  it('moves the preview only after the handles settle', () => {
    const { result } = renderHook(() => useTrim(65, 102));
    act(() => result.current.setStart(70));
    expect(result.current.trim.start).toBe(70);
    expect(result.current.preview.start).toBe(65);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current.preview).toEqual({ start: 70, end: 102 });
  });

  it('never lets the start pass the end', () => {
    const { result } = renderHook(() => useTrim(65, 102));
    act(() => result.current.setStart(500));
    expect(result.current.trim).toEqual({ start: 101, end: 102 });
  });

  it('resets to the original clip', () => {
    const { result } = renderHook(() => useTrim(65, 102));
    act(() => result.current.setEnd(140));
    expect(result.current.isOriginal).toBe(false);
    act(() => result.current.reset());
    expect(result.current.trim).toEqual({ start: 65, end: 102 });
  });

  it('can jump the preview to a moment without moving the handles', () => {
    const { result } = renderHook(() => useTrim(65, 102));
    act(() => result.current.previewFrom(90));
    expect(result.current.preview).toEqual({ start: 90, end: 105 });
    expect(result.current.trim).toEqual({ start: 65, end: 102 });
  });
});
