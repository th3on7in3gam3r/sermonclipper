// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

vi.mock('react-hot-toast', () => {
  const t = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), loading: vi.fn(() => 'toast-id') });
  return { default: t };
});

import { useClipRendering } from './useClipRendering';

const clip = { index: 0, start: '0:10', end: '0:40', hook_title: 'Hope', suggested_captions: ['cap'] };

function setup(overrides: Partial<Parameters<typeof useClipRendering>[0]> = {}) {
  const onUpgradeRequired = vi.fn();
  const hook = renderHook(() =>
    useClipRendering({
      jobId: 'job1',
      clips: [clip],
      sourceUrl: 'https://cdn.example.com/master.mp4',
      userStatus: { plan: 'creator' },
      isYouTubeSource: false,
      onUpgradeRequired,
      ...overrides,
    })
  );
  return { ...hook, onUpgradeRequired };
}

function mockFetch(statuses: Array<Record<string, unknown>>) {
  const queue = [...statuses];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fn = vi.fn(async (url: string, _init?: RequestInit) => {
    let body: unknown = {};
    if (url === '/api/render-clip') body = { shotstackId: 'ss_1' };
    else if (url.startsWith('/api/render-status')) body = queue.length > 1 ? queue.shift() : queue[0];
    return { ok: true, status: 200, json: async () => body } as Response;
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

const statusCalls = (fn: ReturnType<typeof mockFetch>) =>
  fn.mock.calls.filter(([u]) => String(u).startsWith('/api/render-status')).length;

describe('useClipRendering', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('starts a render, polls status, and completes', async () => {
    const fetchFn = mockFetch([{ status: 'rendering', percent: 40 }, { status: 'done', url: 'https://out/reel.mp4' }]);
    const { result } = setup();

    await act(async () => {
      await result.current.startExport(clip, { template: 'bold', caption: 'Custom' });
    });
    expect(result.current.renderProgress[0]).toBe(40);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(result.current.rendering[0]).toEqual({ status: 'complete', url: 'https://out/reel.mp4' });
    expect(result.current.renderProgress[0]).toBe(100);
    expect(result.current.completedExportCount).toBe(1);

    const body = JSON.parse(String(fetchFn.mock.calls.find(([u]) => u === '/api/render-clip')![1]!.body));
    expect(body).toMatchObject({
      jobId: 'job1',
      videoUrl: 'https://cdn.example.com/master.mp4',
      template: 'bold',
      filter: 'none',
      clip: { start: '0:10', end: '0:40', suggested_captions: ['Custom'] },
    });
  });

  it('blocks export on the free plan and asks for an upgrade', async () => {
    const fetchFn = mockFetch([]);
    const { result, onUpgradeRequired } = setup({ userStatus: { plan: 'free' } });
    await act(async () => {
      await result.current.startExport(clip);
    });
    expect(onUpgradeRequired).toHaveBeenCalled();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('lets admins export on any plan', async () => {
    const fetchFn = mockFetch([{ status: 'rendering' }]);
    const { result } = setup({ userStatus: { plan: 'free', isAdmin: true } });
    await act(async () => {
      await result.current.startExport(clip);
    });
    expect(fetchFn.mock.calls.some(([u]) => u === '/api/render-clip')).toBe(true);
  });

  it('never renders YouTube sources', async () => {
    const fetchFn = mockFetch([]);
    const { result } = setup({ isYouTubeSource: true });
    await act(async () => {
      await result.current.startExport(clip);
    });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('stops polling render status after unmount', async () => {
    const fetchFn = mockFetch([{ status: 'rendering', percent: 10 }]);
    const { result, unmount } = setup();
    await act(async () => {
      await result.current.startExport(clip);
    });
    const before = statusCalls(fetchFn);
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(statusCalls(fetchFn)).toBe(before);
  });
});
