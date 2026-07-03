/** Whether the URL points at YouTube (not directly downloadable as MP4). */
export function isYouTubeUrl(url: string): boolean {
  return /youtu\.be|youtube\.com/i.test(url);
}

export function isR2StorageUrl(url: string): boolean {
  return url.includes('.r2.cloudflarestorage.com');
}

/** Fix legacy double-protocol CDN URLs saved before host normalization. */
export function fixMalformedMediaUrl(url: string): string {
  return url
    .replace(/^https:\/\/https\/\//i, 'https://')
    .replace(/^https:\/\/https:\/\//i, 'https://');
}

/**
 * Extract an R2/CDN storage key (uploads/… or sermons/…) from a key or delivery URL.
 * Returns null for external URLs that are not Vesper storage.
 */
/** Normalize any legacy reference (R2 URL, /api/media link, key) to a storage key. */
export function toStorageKey(urlOrKey: string): string | null {
  const cleaned = fixMalformedMediaUrl(urlOrKey.trim());
  const fromDelivery = extractStorageKeyFromDeliveryUrl(cleaned);
  if (fromDelivery) return fromDelivery;

  if (isR2StorageUrl(cleaned)) {
    try {
      return extractR2Key(cleaned);
    } catch {
      return null;
    }
  }

  if (cleaned.includes('/api/media')) {
    try {
      const key = new URL(cleaned, 'https://vesper.local').searchParams.get('key');
      if (key) return key.replace(/^\/+/, '');
    } catch {
      /* ignore */
    }
  }

  return null;
}

export function extractStorageKeyFromDeliveryUrl(urlOrKey: string): string | null {
  const trimmed = fixMalformedMediaUrl(urlOrKey.trim());
  if (/^(uploads|sermons)\//.test(trimmed)) {
    return trimmed.replace(/^\/+/, '');
  }
  if (isR2StorageUrl(trimmed)) {
    return extractR2Key(trimmed);
  }
  if (!trimmed.includes('://')) {
    return null;
  }
  try {
    const path = decodeURIComponent(new URL(trimmed).pathname).replace(/^\/+/, '');
    if (/^(uploads|sermons)\//.test(path)) return path;
  } catch {
    /* ignore invalid URLs */
  }
  return null;
}

export function needsMediaDeliveryResolve(url: string): boolean {
  if (isYouTubeUrl(url)) return false;
  // Never expose raw R2 URLs (including expired presigned PUT/GET) to the browser.
  if (isR2StorageUrl(url)) return true;
  if (extractStorageKeyFromDeliveryUrl(url)) return true;
  if (/^(uploads|sermons)\//.test(url)) return true;
  if (/\/\/https/i.test(url)) return true;
  // Expired presigned R2 URLs should be refreshed via /api/video-url.
  if (url.includes('X-Amz-Signature') && isR2StorageUrl(url)) return true;
  return false;
}

/** True when Vesper has a harvestable master file (R2 upload, direct MP4, storage key, etc.). */
export function isDownloadableMasterUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (isYouTubeUrl(url)) return false;
  if (/^uploads\//.test(url) || /^sermons\//.test(url)) return true;
  return isR2StorageUrl(url) || /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

export function extractR2Key(rawUrl: string): string {
  const urlObj = new URL(rawUrl);
  const decodedPath = decodeURIComponent(urlObj.pathname);
  const pathParts = decodedPath.split('/').filter(Boolean);
  return pathParts.slice(1).join('/');
}
