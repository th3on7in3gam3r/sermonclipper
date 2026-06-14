import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getHeroDemoClip, type HeroDemoPanel } from '@/lib/heroDemoConfig';
import { getMediaDeliveryUrl } from '@/lib/cdn';

function demoStreamPath(panel: HeroDemoPanel): string {
  const clip = getHeroDemoClip(panel);
  return join(process.cwd(), 'public', clip.publicSrc.replace(/^\//, ''));
}

export async function GET(req: NextRequest) {
  const panel = req.nextUrl.searchParams.get('panel') as HeroDemoPanel | null;

  if (panel !== 'before' && panel !== 'after') {
    return NextResponse.json({ error: 'panel must be "before" or "after"' }, { status: 400 });
  }

  if (req.nextUrl.searchParams.get('stream') === '1') {
    try {
      const bytes = await readFile(demoStreamPath(panel));
      return new NextResponse(bytes, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Cache-Control': 'public, max-age=86400, immutable',
          'Accept-Ranges': 'bytes',
        },
      });
    } catch (error) {
      console.error('[Demo Video] Stream failed:', error);
      return NextResponse.json({ error: 'Demo preview not found' }, { status: 404 });
    }
  }

  const clip = getHeroDemoClip(panel);
  const clipEnd = panel === 'before' ? clip.clipEnd : null;
  const streamUrl = `/api/demo-video?panel=${panel}&stream=1`;

  const payload = {
    clipStart: clip.clipStart,
    clipEnd,
    fallbackUrl: streamUrl,
  };

  const preferPublic = process.env.HERO_DEMO_PREFER_CDN !== 'true';

  if (preferPublic) {
    return NextResponse.json({
      ...payload,
      url: streamUrl,
      source: 'public',
    });
  }

  try {
    const url = await getMediaDeliveryUrl(clip.storageKey);
    return NextResponse.json({
      ...payload,
      url,
      source: 'signed',
    });
  } catch (error) {
    console.error('[Demo Video] Signed delivery failed, using public preview:', error);
    return NextResponse.json({
      ...payload,
      url: streamUrl,
      source: 'public',
    });
  }
}
