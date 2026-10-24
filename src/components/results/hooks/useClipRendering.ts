'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { planAllowsExport } from '@/lib/plans';
import type { ExportSettings, RenderState, SermonClip } from '@/lib/studio/types';
import type { AnalysisClip, ResultsUserStatus } from '@/lib/results/types';

type Params = {
  jobId: string | null;
  clips: AnalysisClip[] | undefined;
  sourceUrl: string | null;
  userStatus: ResultsUserStatus | null;
  isYouTubeSource: boolean;
  onUpgradeRequired: () => void;
};

const POLL_MS = 3000;
const BATCH_SIZE = 3;
const BATCH_GAP_MS = 2000;

/** Cloud (Shotstack) reel rendering: start, poll status, batch export. */
export function useClipRendering({ jobId, clips, sourceUrl, userStatus, isYouTubeSource, onUpgradeRequired }: Params) {
  const [rendering, setRendering] = useState<Record<number, RenderState>>({});
  const [renderProgress, setRenderProgress] = useState<Record<number, number>>({});

  // Status polls must stop when the page unmounts.
  const alive = useRef(true);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    alive.current = true;
    const pending = timers.current;
    return () => {
      alive.current = false;
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  // Latest clips for the completion callback without re-creating handlers.
  const clipsRef = useRef(clips);
  useEffect(() => {
    clipsRef.current = clips;
  }, [clips]);

  const setState = (index: number, state: RenderState) => setRendering((prev) => ({ ...prev, [index]: state }));
  const setPercent = (index: number, pct: number) => setRenderProgress((prev) => ({ ...prev, [index]: pct }));

  /** Resolves after `ms`, or never if the page unmounts first (its timer is cleared). */
  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      const t = setTimeout(() => {
        timers.current.delete(t);
        resolve();
      }, ms);
      timers.current.add(t);
    });

  const pollStatus = useCallback(
    async (id: string, index: number, toastId: string) => {
      while (alive.current) {
        let data: { status?: string; percent?: number; url?: string };
        try {
          const res = await fetch(`/api/render-status?id=${encodeURIComponent(id)}`);
          data = await res.json();
        } catch {
          if (!alive.current) return;
          setState(index, { status: 'error', error: 'Lost connection to render status.' });
          toast.error('Lost connection to render status.', { id: toastId });
          return;
        }
        if (!alive.current) return;

        if (typeof data.percent === 'number') setPercent(index, Math.round(data.percent));

        if (data.status === 'done') {
          setState(index, { status: 'complete', url: data.url });
          setPercent(index, 100);
          toast.success('Your reel is ready — download or share below.', { id: toastId, duration: 6000 });

          const clip = clipsRef.current?.[index];
          if (jobId && data.url) {
            fetch('/api/clips/export-record', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clipId: `${jobId}:${index}`, renderUrl: data.url }),
            }).catch(() => {});
          }
          fetch('/api/email/render-complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clipTitle: clip?.hook_title || clip?.main_quote || 'Your clip',
              resultsUrl: `${window.location.origin}${window.location.pathname}${window.location.search}`,
            }),
          }).catch(() => {});
          return;
        }
        if (data.status === 'failed') {
          setState(index, { status: 'error', error: 'Cloud render failed.' });
          toast.error('Cloud render failed.', { id: toastId });
          return;
        }
        await sleep(POLL_MS);
      }
    },
    [jobId]
  );

  const startExport = useCallback(
    async (clip: SermonClip, settings: Partial<ExportSettings> = {}) => {
      if (isYouTubeSource) {
        toast.error('Export requires a direct MP4 upload. YouTube streaming cannot be rendered.');
        return;
      }
      if (!planAllowsExport(userStatus?.plan) && userStatus?.isAdmin !== true) {
        onUpgradeRequired();
        toast.error('Export requires the Creator plan ($19/mo). Upgrade to generate reels.', { duration: 5000 });
        return;
      }

      const { index } = clip;
      setState(index, { status: 'loading' });
      setPercent(index, 2);
      const toastId = toast.loading('Starting cloud render…');

      const {
        template = 'minimal',
        filter = 'none',
        font = 'outfit',
        animation = 'fade',
        trimStart,
        trimEnd,
        caption,
        ...extras
      } = settings;

      try {
        const res = await fetch('/api/render-clip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            videoUrl: sourceUrl,
            clip: {
              ...clip,
              start: trimStart || clip.start,
              end: trimEnd || clip.end,
              suggested_captions: caption ? [caption] : clip.suggested_captions,
            },
            index,
            template,
            filter,
            font,
            animation,
            ...extras,
          }),
        });
        const data = await res.json();

        if (data.code === 'UPGRADE_REQUIRED') {
          onUpgradeRequired();
          setState(index, { status: 'error', error: data.error });
          toast.error(data.error || 'Upgrade required to export reels.', { id: toastId });
          return;
        }
        if (data.shotstackId) {
          setPercent(index, 8);
          toast.loading('Neural rendering in progress…', { id: toastId });
          void pollStatus(data.shotstackId, index, toastId);
        } else {
          const errMsg = data.error || `Export failed (${res.status}).`;
          setState(index, { status: 'error', error: errMsg });
          toast.error(errMsg, { id: toastId, duration: 6000 });
        }
      } catch {
        setState(index, { status: 'error', error: 'Network error during rendering.' });
        toast.error('Network error during rendering.', { id: toastId });
      }
    },
    [isYouTubeSource, userStatus, onUpgradeRequired, jobId, sourceUrl, pollStatus]
  );

  const batchExport = useCallback(async () => {
    const all = clipsRef.current;
    if (!all) return;
    toast.success('Batch export initiated! Firing up neural engines...', { icon: '🚀' });
    for (let i = 0; i < all.length; i += BATCH_SIZE) {
      const batch = all.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((clip, j) => startExport({ ...clip, index: i + j } as SermonClip)));
      // Throttle slightly to respect cloud rendering bounds.
      if (i + BATCH_SIZE < all.length) await new Promise((r) => setTimeout(r, BATCH_GAP_MS));
    }
  }, [startExport]);

  const completedExportCount = Object.values(rendering).filter((r) => r.status === 'complete').length;

  return { rendering, renderProgress, startExport, batchExport, completedExportCount };
}
