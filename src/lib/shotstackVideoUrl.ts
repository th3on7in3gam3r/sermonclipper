import { generatePresignedGetUrl } from './r2';
import { extractR2Key, isR2StorageUrl } from './videoSource';

/** Shotstack must fetch the source over HTTPS; private R2 objects need a presigned GET URL. */
export async function resolveShotstackVideoUrl(videoUrl: string): Promise<string> {
  if (!isR2StorageUrl(videoUrl)) {
    return videoUrl;
  }

  if (videoUrl.includes('X-Amz-Signature')) {
    return videoUrl;
  }

  const key = extractR2Key(videoUrl);
  if (!key) {
    throw new Error('Could not resolve storage key for the uploaded sermon video.');
  }

  return generatePresignedGetUrl(key, 7200);
}
