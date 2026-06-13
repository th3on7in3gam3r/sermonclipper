/** Build a short /results URL — video URLs are loaded server-side by jobId. */
export function buildStudioHref(jobId: string, clipIndex: number): string {
  const params = new URLSearchParams({
    jobId,
    clip: String(clipIndex),
  });
  return `/results?${params.toString()}`;
}

/** Normalize legacy or mixed analysis shapes into { clips: [...] }. */
export function normalizeSermonAnalysis(
  analysis: unknown
): Record<string, unknown> | null {
  if (!analysis || typeof analysis !== 'object') return null;
  const raw = analysis as Record<string, unknown>;

  if (Array.isArray(raw.clips) && raw.clips.length > 0) {
    return raw;
  }

  if (Array.isArray(raw.sermon_clips) && raw.sermon_clips.length > 0) {
    return { ...raw, clips: raw.sermon_clips };
  }

  if (Array.isArray(raw.clips)) {
    return raw;
  }

  return null;
}
