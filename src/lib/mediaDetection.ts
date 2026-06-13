const AUDIO_EXT = /\.(mp3|m4a|aac|wav|ogg|flac|wma|mp4a|m4b)($|\?)/i;

export function isAudioMediaUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return AUDIO_EXT.test(lower) || lower.includes('/audio/') || lower.includes('audio%2F');
}

export function encodeClipId(jobId: string, clipIndex: number): string {
  return `${jobId}-${clipIndex}`;
}

export function parseClipId(clipId: string): { jobId: string; clipIndex: number } | null {
  const lastDash = clipId.lastIndexOf('-');
  if (lastDash <= 0) return null;
  const jobId = clipId.slice(0, lastDash);
  const clipIndex = Number(clipId.slice(lastDash + 1));
  if (!jobId || Number.isNaN(clipIndex)) return null;
  return { jobId, clipIndex };
}
