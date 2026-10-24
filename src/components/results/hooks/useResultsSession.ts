'use client';

import { useEffect, useState } from 'react';
import { isDownloadableMasterUrl } from '@/lib/videoSource';
import { normalizeSermonAnalysis } from '@/lib/studioNavigation';
import { getYouTubeId, nextPollDelay } from '@/lib/results/helpers';
import type { ResultsUserStatus, SermonAnalysis } from '@/lib/results/types';

type Params = {
  jobId: string | null;
  userId: string | null | undefined;
  videoUrl: string | null;
  finalPathParam: string | null;
};

async function getJson(url: string) {
  const res = await fetch(url);
  return res.ok ? res.json() : null;
}

/**
 * Loads everything the results page knows about a job: the analysis (polling
 * until clips exist), the harvested master file, the archived source URL and
 * the user's plan status. Derives which video source the page should use.
 */
export function useResultsSession({ jobId, userId, videoUrl, finalPathParam }: Params) {
  const [analysis, setAnalysis] = useState<SermonAnalysis | null>(null);
  const [userStatus, setUserStatus] = useState<ResultsUserStatus | null>(null);
  const [masterPath, setMasterPath] = useState<string | null>(null);
  const [archivedVideoUrl, setArchivedVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();
    const q = encodeURIComponent(jobId);

    const applyMaster = (path: unknown) => {
      if (!cancelled && typeof path === 'string' && isDownloadableMasterUrl(path)) setMasterPath(path);
    };
    const applyAnalysis = (raw: unknown) => {
      const normalized = normalizeSermonAnalysis(raw) as SermonAnalysis | null;
      if (!cancelled && normalized) setAnalysis(normalized);
      return normalized;
    };
    const loadSermon = async () => {
      const sermon = await getJson(`/api/sermons?jobId=${q}`);
      if (cancelled || !sermon) return null;
      applyMaster(sermon.finalPath);
      if (sermon.videoUrl) setArchivedVideoUrl(sermon.videoUrl);
      return sermon;
    };

    /** One poll. Returns true once there is nothing more to wait for. */
    const tick = async (): Promise<boolean> => {
      try {
        const progress = await getJson(`/api/progress?jobId=${q}`);
        if (cancelled) return true;
        applyMaster(progress?.finalPath);
        if (progress?.analysis) return Boolean(applyAnalysis(progress.analysis)?.clips);
        if (progress?.clips) return Boolean(applyAnalysis(progress)?.clips);

        // Archived sermons (opened from the dashboard) may no longer have progress analysis.
        const sermon = await loadSermon();
        return Boolean(sermon && applyAnalysis(sermon.analysis));
      } catch (e) {
        console.error('Failed to fetch results:', e);
        return false;
      }
    };

    const loop = async () => {
      if (await tick()) return;
      const delay = nextPollDelay(Date.now() - startedAt);
      if (delay !== null && !cancelled) timer = setTimeout(loop, delay);
    };

    // The archived source URL is shown even when progress already has the analysis.
    if (userId) void loadSermon().catch(() => {});
    getJson('/api/user/status')
      .then((data) => !cancelled && setUserStatus(data))
      .catch((e) => console.error('Failed to fetch user status:', e));
    void loop();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId, userId]);

  // Keep the clip count in sync for onboarding/checklist widgets.
  const clipCount = analysis?.clips?.length ?? 0;
  useEffect(() => {
    if (clipCount <= 0) return;
    try {
      localStorage.setItem('vesper-clip-count', String(clipCount));
    } catch {
      /* storage unavailable */
    }
    window.dispatchEvent(new Event('vesper-clip-created'));
  }, [clipCount]);

  const effectiveVideoUrl = videoUrl || archivedVideoUrl;
  const masterDownloadUrl =
    [masterPath, finalPathParam, effectiveVideoUrl].find(
      (u): u is string => Boolean(u) && isDownloadableMasterUrl(u as string)
    ) ?? null;
  /** Master file or legacy URL for this session — works without ?videoUrl= in the query string. */
  const sessionVideoSource = masterDownloadUrl || effectiveVideoUrl;
  const videoId = getYouTubeId(effectiveVideoUrl);

  return {
    analysis,
    userStatus,
    clipCount,
    effectiveVideoUrl,
    masterDownloadUrl,
    sessionVideoSource,
    videoId,
    /** YouTube sources can be analyzed but not rendered (Shotstack needs a direct file). */
    isYouTubeSource: Boolean(videoId),
  };
}
