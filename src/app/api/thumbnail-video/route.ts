import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getR2ObjectMetadata, getR2ObjectRange, getObjectFromR2 } from '@/lib/r2';
import { VIDEO_CACHE_CONTROL } from '@/lib/storageKeys';
import { toStorageKey } from '@/lib/videoSource';

const ALLOW_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || '*';

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range',
    'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length',
  };
}

/** OPTIONS — CORS preflight for Thumbnail Studio frame capture. */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

/**
 * Auth-gated R2 stream with CORS — enables canvas frame capture in Thumbnail Studio.
 * GET /api/thumbnail-video?key=uploads/...
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = req.nextUrl.searchParams.get('key') || req.nextUrl.searchParams.get('url') || '';
  const key = toStorageKey(raw) || raw.replace(/^\/+/, '');
  if (!key || key.includes('..') || !/^(uploads|sermons)\//.test(key)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
  }

  try {
    const { contentLength, contentType } = await getR2ObjectMetadata(key);
    if (!contentLength) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const baseHeaders = {
      ...corsHeaders(),
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': VIDEO_CACHE_CONTROL,
    };

    const rangeHeader = req.headers.get('range');

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : contentLength - 1;

      if (Number.isNaN(start) || start >= contentLength) {
        return new NextResponse('Requested range not satisfiable', {
          status: 416,
          headers: { ...baseHeaders, 'Content-Range': `bytes */${contentLength}` },
        });
      }

      const safeEnd = Math.min(end, contentLength - 1);
      const { body, contentType: rangeType } = await getR2ObjectRange(key, start, safeEnd);

      return new NextResponse(body.transformToWebStream(), {
        status: 206,
        headers: {
          ...baseHeaders,
          'Content-Type': rangeType,
          'Content-Range': `bytes ${start}-${safeEnd}/${contentLength}`,
          'Content-Length': String(safeEnd - start + 1),
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
        ...baseHeaders,
        'Content-Length': String(contentLength),
      },
    });
  } catch (error) {
    console.error('[Thumbnail Video] Stream error:', error);
    return NextResponse.json({ error: 'Failed to load media' }, { status: 500 });
  }
}
