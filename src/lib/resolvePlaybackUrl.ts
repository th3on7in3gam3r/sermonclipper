import { fixMalformedMediaUrl, isYouTubeUrl, needsMediaDeliveryResolve } from '@/lib/videoSource';

/** Resolve a storage key or legacy URL to a browser-playable URL via /api/video-url. */
export async function resolveClientPlaybackUrl(url: string): Promise<string> {
  const cleaned = fixMalformedMediaUrl(url);
  if (isYouTubeUrl(cleaned)) return cleaned;
  if (!needsMediaDeliveryResolve(cleaned)) return cleaned;

  const res = await fetch(`/api/video-url?url=${encodeURIComponent(cleaned)}`);
  if (!res.ok) return cleaned;
  const data = (await res.json()) as { url?: string };
  return data.url ? fixMalformedMediaUrl(data.url) : cleaned;
}
