import { NextRequest, NextResponse } from 'next/server';
import { verifyMediaToken } from '@/lib/cdn';
import { getR2ObjectMetadata, getR2ObjectRange, getObjectFromR2 } from '@/lib/r2';
import { VIDEO_CACHE_CONTROL } from '@/lib/storageKeys';

/**
 * Signed media delivery — streams private R2 objects without exposing storage URLs.
 * Supports HTTP Range requests required by HTML5 video seeking/preview.
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
    const { contentLength, contentType } = await getR2ObjectMetadata(key);
    if (!contentLength) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const rangeHeader = req.headers.get('range');

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : contentLength - 1;

      if (Number.isNaN(start) || start >= contentLength) {
        return new NextResponse('Requested range not satisfiable', {
          status: 416,
          headers: { 'Content-Range': `bytes */${contentLength}` },
        });
      }

      const safeEnd = Math.min(end, contentLength - 1);
      const { body, contentType: rangeType } = await getR2ObjectRange(key, start, safeEnd);

      return new NextResponse(body.transformToWebStream(), {
        status: 206,
        headers: {
          'Content-Type': rangeType,
          'Content-Range': `bytes ${start}-${safeEnd}/${contentLength}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(safeEnd - start + 1),
          'Cache-Control': VIDEO_CACHE_CONTROL,
        },
      });
    }

    const body = await getObjectFromR2(key);
    if (!body) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return new NextResponse(body.transformToWebStream(), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(contentLength),
        'Accept-Ranges': 'bytes',
        'Cache-Control': VIDEO_CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error('[Media] Stream error:', error);
    return NextResponse.json({ error: 'Failed to load media' }, { status: 500 });
  }
}
