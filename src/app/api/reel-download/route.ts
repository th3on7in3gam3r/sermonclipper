import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isShotstackOutputUrl, sanitizeReelFilename } from '@/lib/reelDownload';

/**
 * Proxy Shotstack render downloads with Content-Disposition: attachment.
 * Browsers ignore `<a download>` on cross-origin S3 URLs and open them inline instead.
 *
 * GET /api/reel-download?url=<encoded>&filename=<optional>
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Sign in to download reels.' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const rawUrl = searchParams.get('url');
    const filenameParam = searchParams.get('filename') || 'vesper-reel.mp4';

    if (!rawUrl) {
      return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
    }

    if (!isShotstackOutputUrl(rawUrl)) {
      return NextResponse.json({ error: 'Invalid render URL' }, { status: 400 });
    }

    const upstream = await fetch(rawUrl, { redirect: 'follow' });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: `Could not fetch render (${upstream.status})` }, { status: 502 });
    }

    const filename = sanitizeReelFilename(filenameParam.replace(/\.mp4$/i, ''));

    const headers = new Headers();
    headers.set('Content-Type', upstream.headers.get('Content-Type') || 'video/mp4');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    const length = upstream.headers.get('Content-Length');
    if (length) headers.set('Content-Length', length);

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Download failed';
    console.error('[Reel Download] Error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
