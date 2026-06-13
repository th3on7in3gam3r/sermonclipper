/** Max sermon length for YouTube analysis (3 hours). */
export const MAX_YOUTUBE_DURATION_SECONDS = 3 * 60 * 60;

const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;

export function extractYouTubeVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const match = trimmed.match(YOUTUBE_ID_PATTERN);
  return match?.[1] ?? null;
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

export type YouTubeValidationResult =
  | { ok: true; videoId: string; title?: string; durationSeconds?: number }
  | { ok: false; code: 'invalid' | 'unavailable' | 'too_long'; message: string; durationSeconds?: number };

export function formatDurationHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${minutes} minutes`;
  if (minutes === 0) return `${hours} hour${hours === 1 ? '' : 's'}`;
  return `${hours} hour${hours === 1 ? '' : 's'} ${minutes} min`;
}

export function validateYouTubeDuration(durationSeconds: number | undefined): YouTubeValidationResult | null {
  if (durationSeconds == null || Number.isNaN(durationSeconds)) return null;
  if (durationSeconds > MAX_YOUTUBE_DURATION_SECONDS) {
    return {
      ok: false,
      code: 'too_long',
      message: `This sermon is ${formatDurationHours(durationSeconds)} long — processing works best on videos under 3 hours.`,
      durationSeconds,
    };
  }
  return null;
}
