/**
 * Which stored sermon file a URL points at, and whether it belongs to a job.
 * Pure (no network) so it can be unit-tested.
 */
import { extractStorageKeyFromDeliveryUrl } from './videoSource';

/**
 * Storage key (uploads/… or sermons/…) for any form the app hands around:
 * a bare key, an R2 URL (signed or not), a CDN URL, or an app-signed
 * /api/media?key=… link. Null for anything that isn't Vesper storage.
 */
export function storageKeyFor(urlOrKey: string | null | undefined): string | null {
  if (!urlOrKey) return null;
  const value = urlOrKey.trim();

  if (value.startsWith('/api/media') || value.includes('/api/media?')) {
    try {
      const key = new URL(value, 'https://placeholder.invalid').searchParams.get('key');
      return key && /^(uploads|sermons)\//.test(key) ? key : null;
    } catch {
      return null;
    }
  }

  try {
    return extractStorageKeyFromDeliveryUrl(value);
  } catch {
    return null;
  }
}

/** Keys are uploads/<jobId>/<uuid>.<ext> or sermons/<jobId>.mp4 (see storageKeys.ts). */
export function keyBelongsToJob(key: string, jobId: string): boolean {
  if (!jobId || /[/\\]/.test(jobId)) return false;
  return key.startsWith(`uploads/${jobId}/`) || key.startsWith(`sermons/${jobId}.`) || key.startsWith(`sermons/${jobId}/`);
}

export type SourceCandidates = {
  jobId: string;
  /** finalPath saved on the job's progress record. */
  progressPath?: string | null;
  /** finalPath saved on the sermon record. */
  sermonPath?: string | null;
  /** The sermon's original external URL, if it came from one. */
  sermonVideoUrl?: string | null;
  /** What the browser sent. Only trusted when it points at this job's own files. */
  clientUrl?: string | null;
};

/**
 * Pick the video to render: server-side records first, then the browser's URL
 * only if it is this job's own stored file (or the sermon's own external URL).
 */
export function chooseRenderSource(c: SourceCandidates): string | null {
  for (const path of [c.progressPath, c.sermonPath]) {
    if (path && path.trim()) return path.trim();
  }
  const client = c.clientUrl?.trim();
  if (!client) return null;
  const key = storageKeyFor(client);
  if (key) return keyBelongsToJob(key, c.jobId) ? key : null;
  if (c.sermonVideoUrl && client === c.sermonVideoUrl.trim()) return client;
  return null;
}
