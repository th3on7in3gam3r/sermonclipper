/** Build a short /results URL — video URLs are loaded server-side by jobId. */
export function buildStudioHref(jobId: string, clipIndex: number): string {
  const params = new URLSearchParams({
    jobId,
    clip: String(clipIndex),
  });
  return `/results?${params.toString()}`;
}

/** Full-page navigation — reliable even when the PWA service worker is active. */
export function openStudio(jobId: string, clipIndex: number): boolean {
  if (!jobId) return false;
  window.location.assign(buildStudioHref(jobId, clipIndex));
  return true;
}

/** Normalize legacy or mixed analysis shapes into { clips: [...] }. */
export function normalizeSermonAnalysis(
  analysis: unknown
): Record<string, unknown> | null {
  if (!analysis || typeof analysis !== 'object') return null;
  const raw = analysis as Record<string, unknown>;

  let clips: unknown[] | undefined;
  if (Array.isArray(raw.clips) && raw.clips.length > 0) {
    clips = raw.clips;
  } else if (Array.isArray(raw.sermon_clips) && raw.sermon_clips.length > 0) {
    clips = raw.sermon_clips;
  } else if (Array.isArray(raw.clips)) {
    clips = raw.clips;
  }

  if (!clips) return null;

  const normalizedClips = clips.map((clip) => {
    if (!clip || typeof clip !== 'object') return clip;
    const c = clip as Record<string, unknown>;
    const start = c.start ?? c.start_time ?? 0;
    const end = c.end ?? c.end_time ?? 0;
    return { ...c, start, end };
  });

  return { ...raw, clips: normalizedClips };
}
