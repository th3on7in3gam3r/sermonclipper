import { NextRequest, NextResponse } from 'next/server';
import { getHeroDemoClip, type HeroDemoPanel } from '@/lib/heroDemoConfig';
import { getMediaDeliveryUrl } from '@/lib/cdn';

export async function GET(req: NextRequest) {
  const panel = req.nextUrl.searchParams.get('panel') as HeroDemoPanel | null;

  if (panel !== 'before' && panel !== 'after') {
    return NextResponse.json({ error: 'panel must be "before" or "after"' }, { status: 400 });
  }

  const clip = getHeroDemoClip(panel);
  const clipEnd = panel === 'before' ? clip.clipEnd : null;

  const payload = {
    clipStart: clip.clipStart,
    clipEnd,
    fallbackUrl: clip.publicSrc,
  };

  // Prefer bundled public previews — always work on Vercel without Bunny upload.
  const preferPublic = process.env.HERO_DEMO_PREFER_CDN !== 'true';

  if (preferPublic) {
    return NextResponse.json({
      ...payload,
      url: clip.publicSrc,
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
      url: clip.publicSrc,
      source: 'public',
    });
  }
}
