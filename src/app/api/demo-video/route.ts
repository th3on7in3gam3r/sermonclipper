import { NextRequest, NextResponse } from 'next/server';
import { getHeroDemoClip, type HeroDemoPanel } from '@/lib/heroDemoConfig';
import { getMediaDeliveryUrl } from '@/lib/cdn';

export async function GET(req: NextRequest) {
  const panel = req.nextUrl.searchParams.get('panel') as HeroDemoPanel | null;

  if (panel !== 'before' && panel !== 'after') {
    return NextResponse.json({ error: 'panel must be "before" or "after"' }, { status: 400 });
  }

  const clip = getHeroDemoClip(panel);

  try {
    if (clip.cdnPath) {
      return NextResponse.json({
        url: clip.cdnPath,
        clipStart: clip.clipStart,
        clipEnd: panel === 'before' ? clip.clipEnd : null,
        source: 'cdn',
      });
    }

    const url = await getMediaDeliveryUrl(clip.storageKey);
    return NextResponse.json({
      url,
      clipStart: clip.clipStart,
      clipEnd: panel === 'before' ? clip.clipEnd : null,
      source: 'signed',
    });
  } catch (error) {
    console.error('[Demo Video] Delivery failed:', error);

    if (clip.fallbackSrc) {
      return NextResponse.json({
        url: clip.fallbackSrc,
        clipStart: 0,
        clipEnd: null,
        fallback: true,
      });
    }

    const msg = error instanceof Error ? error.message : 'Failed to load demo video';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
