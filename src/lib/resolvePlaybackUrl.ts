import {
  fixMalformedMediaUrl,
  isR2StorageUrl,
  isYouTubeUrl,
  needsMediaDeliveryResolve,
  toStorageKey,
} from '@/lib/videoSource';

/** Resolve a storage key or legacy URL to a browser-playable URL via /api/video-url. */
export async function resolveClientPlaybackUrl(url: string): Promise<string> {
  const cleaned = fixMalformedMediaUrl(url);
  if (isYouTubeUrl(cleaned)) return cleaned;
  if (!needsMediaDeliveryResolve(cleaned)) return cleaned;

  const storageKey = toStorageKey(cleaned);
  const query = storageKey
    ? `key=${encodeURIComponent(storageKey)}`
    : `url=${encodeURIComponent(cleaned)}`;

  const res = await fetch(`/api/video-url?${query}`);
  if (res.ok) {
    const data = (await res.json()) as { url?: string };
    if (data.url) return fixMalformedMediaUrl(data.url);
  }

  if (isR2StorageUrl(cleaned) || storageKey) {
    throw new Error('Could not resolve a playable URL for this upload');
  }

  return cleaned;
}
