import { getInternalFetchUrl } from './cdn';
import { extractR2Key, isR2StorageUrl } from './videoSource';

/** Shotstack must fetch the source over HTTPS; private R2 objects need a presigned GET URL. */
export async function resolveShotstackVideoUrl(videoUrl: string): Promise<string> {
  if (!isR2StorageUrl(videoUrl) && !videoUrl.startsWith('uploads/') && !videoUrl.startsWith('sermons/')) {
    return videoUrl;
  }

  if (videoUrl.includes('X-Amz-Signature')) {
    return videoUrl;
  }

  const key = isR2StorageUrl(videoUrl) ? extractR2Key(videoUrl) : videoUrl.replace(/^\/+/, '');
  if (!key) {
    throw new Error('Could not resolve storage key for the uploaded sermon video.');
  }

  return getInternalFetchUrl(key, 7200);
}
