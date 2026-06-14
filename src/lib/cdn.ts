import { createHmac } from 'crypto';
import { generatePresignedGetUrl } from './r2';
import { normalizeCdnHost } from './cdnHost';
import { extractR2Key, extractStorageKeyFromDeliveryUrl, isR2StorageUrl } from './videoSource';

const CDN_HOST = normalizeCdnHost(process.env.BUNNY_CDN_HOST);
const BUNNY_TOKEN_KEY = process.env.BUNNY_TOKEN_AUTHENTICATION_KEY;
/** Bunny pull zone must mirror R2 before browser playback via CDN works. Default: stream via /api/media. */
const USE_BUNNY_FOR_PLAYBACK = process.env.BUNNY_PLAYBACK_ENABLED === 'true';
const MEDIA_SIGNING_SECRET =
  process.env.MEDIA_SIGNING_SECRET || process.env.CLERK_SECRET_KEY || 'dev-media-secret';

/** Default signed URL lifetime for user-facing media (1 hour). */
export const MEDIA_URL_EXPIRY_SEC = 3600;

function bunnySignedUrl(path: string, expiresInSec: number): string | null {
  if (!CDN_HOST || !BUNNY_TOKEN_KEY) return null;

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const expires = Math.floor(Date.now() / 1000) + expiresInSec;
  const hash = createHmac('sha256', BUNNY_TOKEN_KEY)
    .update(`${cleanPath}${expires}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `https://${CDN_HOST}${cleanPath}?token=${hash}&expires=${expires}`;
}

function appSignedMediaUrl(key: string, expiresInSec: number): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInSec;
  const payload = `${key}:${exp}`;
  const sig = createHmac('sha256', MEDIA_SIGNING_SECRET).update(payload).digest('hex');
  const params = new URLSearchParams({ key, exp: String(exp), sig });
  return `/api/media?${params.toString()}`;
}

function deliveryUrlForKey(key: string, expiresInSec: number): string {
  if (USE_BUNNY_FOR_PLAYBACK) {
    const bunny = bunnySignedUrl(`/${key}`, expiresInSec);
    if (bunny) return bunny;
  }
  return appSignedMediaUrl(key, expiresInSec);
}

/** Resolve a storage key or internal R2 URL to a user-safe delivery URL (CDN or app-signed). */
export async function getMediaDeliveryUrl(
  keyOrUrl: string,
  expiresInSec = MEDIA_URL_EXPIRY_SEC
): Promise<string> {
  const storageKey = extractStorageKeyFromDeliveryUrl(keyOrUrl);
  if (storageKey) {
    return deliveryUrlForKey(storageKey, expiresInSec);
  }

  if (keyOrUrl.includes('://')) {
    return keyOrUrl;
  }

  const key = keyOrUrl.replace(/^\/+/, '');
  return deliveryUrlForKey(key, expiresInSec);
}

/** For Shotstack / server-side fetch — presigned R2 GET (not exposed to browsers). */
export async function getInternalFetchUrl(
  keyOrUrl: string,
  expiresInSec = MEDIA_URL_EXPIRY_SEC
): Promise<string> {
  const key = isR2StorageUrl(keyOrUrl) ? extractR2Key(keyOrUrl) : keyOrUrl.replace(/^\/+/, '');
  return generatePresignedGetUrl(key, expiresInSec);
}

export function verifyMediaToken(key: string, exp: number, sig: string): boolean {
  if (!key || !exp || !sig) return false;
  if (exp < Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac('sha256', MEDIA_SIGNING_SECRET).update(`${key}:${exp}`).digest('hex');
  return expected === sig;
}

export function isCdnConfigured(): boolean {
  return Boolean(CDN_HOST && BUNNY_TOKEN_KEY);
}
