import { NextRequest, NextResponse } from 'next/server';
import { getHeroDemoClip, type HeroDemoPanel } from '@/lib/heroDemoConfig';
import { generatePresignedGetUrl } from '@/lib/r2';
import { extractR2Key, isR2StorageUrl } from '@/lib/videoSource';

export async function GET(req: NextRequest) {
  const panel = req.nextUrl.searchParams.get('panel') as HeroDemoPanel | null;

  if (panel !== 'before' && panel !== 'after') {
    return NextResponse.json({ error: 'panel must be "before" or "after"' }, { status: 400 });
  }

  const clip = getHeroDemoClip(panel);

  try {
    let url = clip.storageUrl;

    if (isR2StorageUrl(url) && !url.includes('X-Amz-Signature')) {
      url = await generatePresignedGetUrl(extractR2Key(url), 3600);
    }

    return NextResponse.json({
      url,
      clipStart: clip.clipStart,
      clipEnd: clip.clipEnd,
      fallbackSrc: clip.fallbackSrc,
    });
  } catch (error) {
    console.error('[Demo Video] Presign failed:', error);

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
