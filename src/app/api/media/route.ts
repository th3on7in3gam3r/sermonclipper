import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getObjectFromR2, deleteObjectFromR2 } from '@/lib/r2';
import { verifyMediaToken } from '@/lib/cdn';
import { VIDEO_CACHE_CONTROL } from '@/lib/storageKeys';
import { isAllowedVideoBuffer } from '@/lib/fileValidation';

/**
 * Signed media delivery — streams private R2 objects without exposing storage URLs.
 * GET /api/media?key=...&exp=...&sig=...
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const key = searchParams.get('key');
  const exp = Number(searchParams.get('exp'));
  const sig = searchParams.get('sig') || '';

  if (!key || !verifyMediaToken(key, exp, sig)) {
    return NextResponse.json({ error: 'Invalid or expired media link' }, { status: 403 });
  }

  try {
    const body = await getObjectFromR2(key);
    if (!body) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const stream = body.transformToWebStream();
    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Cache-Control': VIDEO_CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error('[Media] Stream error:', error);
    return NextResponse.json({ error: 'Failed to load media' }, { status: 500 });
  }
}
