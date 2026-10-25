import { getInternalFetchUrl } from './cdn';
import { storageKeyFor } from './renderSource';

/** How long Shotstack's download link stays valid. Renders fetch the source at the start. */
const SHOTSTACK_URL_TTL_SEC = 7200;

/**
 * Shotstack downloads the source over public HTTPS. For anything in Vesper
 * storage, always mint a fresh signed link from the storage key — never pass
 * along a link that was signed earlier (it may have expired), a CDN link with
 * its own token, or an app-relative /api/media URL Shotstack can't reach.
 */
export async function resolveShotstackVideoUrl(videoUrl: string): Promise<string> {
  const key = storageKeyFor(videoUrl);
  if (key) return getInternalFetchUrl(key, SHOTSTACK_URL_TTL_SEC);

  if (/^https:\/\//i.test(videoUrl.trim())) return videoUrl.trim();

  throw new Error('The sermon video isn’t stored at a public web address the render service can download.');
}
