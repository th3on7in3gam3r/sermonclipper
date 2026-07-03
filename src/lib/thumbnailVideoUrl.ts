import { isYouTubeUrl, needsMediaDeliveryResolve, toStorageKey } from '@/lib/videoSource';

/** Same-origin video URL with CORS for canvas frame capture in Thumbnail Studio. */
export function getThumbnailCaptureVideoUrl(keyOrUrl: string): string | null {
  if (!keyOrUrl || isYouTubeUrl(keyOrUrl)) return null;

  const key = toStorageKey(keyOrUrl);
  if (key) {
    return `/api/thumbnail-video?key=${encodeURIComponent(key)}`;
  }

  if (needsMediaDeliveryResolve(keyOrUrl)) {
    return null;
  }

  if (keyOrUrl.startsWith('/')) {
    return keyOrUrl;
  }

  return null;
}
