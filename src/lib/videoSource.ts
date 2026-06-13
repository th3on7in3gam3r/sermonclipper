/** Whether the URL points at YouTube (not directly downloadable as MP4). */
export function isYouTubeUrl(url: string): boolean {
  return /youtu\.be|youtube\.com/i.test(url);
}

export function isR2StorageUrl(url: string): boolean {
  return url.includes('.r2.cloudflarestorage.com');
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
