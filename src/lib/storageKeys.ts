import { randomUUID } from 'crypto';

/** Storage paths use UUIDs only — never original filenames (prevents traversal). */
export function buildUploadKey(jobId: string, ext = 'mp4'): string {
  const id = randomUUID();
  return `uploads/${jobId}/${id}.${ext}`;
}

export function buildSermonKey(jobId: string): string {
  return `sermons/${jobId}.mp4`;
}

export function buildClipKey(jobId: string, clipIndex: number): string {
  return `clips/${jobId}/clip-${clipIndex}.mp4`;
}

export const VIDEO_CACHE_CONTROL = 'public, max-age=31536000, immutable';
