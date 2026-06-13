import { NextRequest, NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/siteConfig';

export async function GET(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get('platform');

  if (platform === 'youtube') {
    return NextResponse.json({ url: `${SITE_URL}/api/youtube/auth` });
  }

  return NextResponse.json(
    {
      error: `${platform} direct publishing requires API credentials. Use Download MP4 as a fallback.`,
    },
    { status: 501 }
  );
}
