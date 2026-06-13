import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getMediaDeliveryUrl } from '@/lib/cdn';
import { getR2ObjectUrl } from '@/lib/r2';
import { extractR2Key, isR2StorageUrl } from '@/lib/videoSource';

/**
 * Returns a short-lived delivery URL for private storage (CDN or app-signed).
 * Never returns raw R2 URLs to clients.
 *
 * GET /api/video-url?key=uploads/jobId/uuid.mp4
 * GET /api/video-url?url=<legacy internal url>  (authenticated migration)
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const keyParam = searchParams.get('key');
    const rawUrl = searchParams.get('url');

    let key = keyParam || '';
    if (!key && rawUrl) {
      if (isR2StorageUrl(rawUrl)) {
        key = extractR2Key(rawUrl);
      } else if (!rawUrl.includes('://')) {
        key = rawUrl;
      } else {
        return NextResponse.json({ url: rawUrl });
      }
    }

    if (!key) {
      return NextResponse.json({ error: 'Missing key or url param' }, { status: 400 });
    }

    const playbackUrl = await getMediaDeliveryUrl(key);
    const internalUrl = getR2ObjectUrl(key);

    return NextResponse.json({ url: playbackUrl, key, internalUrl });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate URL';
    console.error('[Video URL] Error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
