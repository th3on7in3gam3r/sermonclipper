/** Pure helpers for the results page (kept framework-free so they're unit-testable). */

const YOUTUBE_ID = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;

/** Extract an 11-char YouTube video id from any common URL shape, or null. */
export function getYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(YOUTUBE_ID);
  return match && match[2].length === 11 ? match[2] : null;
}

/** Share-caption platforms shown in each clip's caption menu. */
export const CAPTION_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📸', prefix: '✨ ', format: 'Feed / Reels', limit: 2200 },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', prefix: '', format: 'Short-form Video', limit: 2200 },
  { id: 'youtube', label: 'YouTube Shorts', icon: '▶️', prefix: '', format: 'Shorts / Description', limit: 500 },
  { id: 'x', label: 'X / Twitter', icon: '🐦', prefix: '', format: 'Post', limit: 280 },
  { id: 'facebook', label: 'Facebook', icon: '📘', prefix: '', format: 'Post / Reel', limit: 63206 },
];

/**
 * Delay before the next results poll. Fast while a job is fresh, slower after
 * a couple of minutes, and `null` (stop) once polling has run for `maxMs` —
 * so an abandoned tab or a bad job id doesn't hit the API forever.
 */
export function nextPollDelay(elapsedMs: number, maxMs = 60 * 60 * 1000): number | null {
  if (elapsedMs >= maxMs) return null;
  if (elapsedMs < 2 * 60 * 1000) return 2000;
  if (elapsedMs < 10 * 60 * 1000) return 5000;
  return 10000;
}

/** Greedy word-wrap using a width measurer (canvas `measureText` in the browser). */
export function wrapWords(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    if (measure(testLine) > maxWidth && i > 0) {
      lines.push(line);
      line = words[i] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  return lines;
}
