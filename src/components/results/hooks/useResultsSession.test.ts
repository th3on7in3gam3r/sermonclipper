// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useResultsSession } from './useResultsSession';

type Routes = Record<string, () => unknown>;

function mockFetch(routes: Routes) {
  const fn = vi.fn(async (url: string) => {
    const key = Object.keys(routes).find((k) => url.startsWith(k));
    const body = key ? routes[key]() : null;
    return { ok: body !== null, json: async () => body } as Response;
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

const calls = (fn: ReturnType<typeof mockFetch>, prefix: string) =>
  fn.mock.calls.filter(([u]) => String(u).startsWith(prefix)).length;

const flush = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
};

describe('useResultsSession', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('stops polling once the analysis has clips', async () => {
    const fetchFn = mockFetch({
      '/api/progress': () => ({ analysis: { sermon_title: 'Grace', clips: [{ start: 1, end: 9 }] } }),
      '/api/user/status': () => ({ plan: 'creator' }),
    });
    const { result } = renderHook(() =>
      useResultsSession({ jobId: 'job1', userId: null, videoUrl: null, finalPathParam: null })
    );
    await flush();

    expect(result.current.analysis?.sermon_title).toBe('Grace');
    expect(result.current.clipCount).toBe(1);
    expect(result.current.userStatus).toEqual({ plan: 'creator' });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });
    expect(calls(fetchFn, '/api/progress')).toBe(1);
  });

  it('keeps polling while processing, then picks up clips', async () => {
    let ready = false;
    const fetchFn = mockFetch({
      '/api/progress': () => (ready ? { clips: [{ start: 0, end: 5 }] } : { status: 'processing' }),
      '/api/sermons': () => null,
    });
    const { result } = renderHook(() =>
      useResultsSession({ jobId: 'job1', userId: null, videoUrl: null, finalPathParam: null })
    );
    await flush();
    expect(result.current.clipCount).toBe(0);

    ready = true;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(result.current.clipCount).toBe(1);
    expect(calls(fetchFn, '/api/progress')).toBe(2);
  });

  it('gives up after the polling window instead of polling forever', async () => {
    const fetchFn = mockFetch({ '/api/progress': () => null, '/api/sermons': () => null });
    renderHook(() => useResultsSession({ jobId: 'missing', userId: null, videoUrl: null, finalPathParam: null }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2 * 60 * 60 * 1000);
    });
    const total = calls(fetchFn, '/api/progress');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    });
    expect(calls(fetchFn, '/api/progress')).toBe(total);
  });

  it('falls back to the archived sermon and derives the master download', async () => {
    mockFetch({
      '/api/progress': () => ({}),
      '/api/sermons': () => ({
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        analysis: { clips: [{ start: 0, end: 3 }] },
      }),
    });
    const { result } = renderHook(() =>
      useResultsSession({ jobId: 'job1', userId: 'u1', videoUrl: null, finalPathParam: null })
    );
    await flush();
    expect(result.current.clipCount).toBe(1);
    expect(result.current.videoId).toBe('dQw4w9WgXcQ');
    expect(result.current.isYouTubeSource).toBe(true);
  });

  it('stops polling on unmount', async () => {
    const fetchFn = mockFetch({ '/api/progress': () => ({ status: 'processing' }), '/api/sermons': () => null });
    const { unmount } = renderHook(() =>
      useResultsSession({ jobId: 'job1', userId: null, videoUrl: null, finalPathParam: null })
    );
    await flush();
    unmount();
    const before = calls(fetchFn, '/api/progress');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(calls(fetchFn, '/api/progress')).toBe(before);
  });
});
