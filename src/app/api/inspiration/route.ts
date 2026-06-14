import { NextRequest, NextResponse } from 'next/server';
import { fetchInspirationFeed } from '@/lib/inspiration/fetchInspiration';

export async function GET(req: NextRequest) {
  const minViews = Number(req.nextUrl.searchParams.get('minViews') || 0);
  const maxDuration = Number(req.nextUrl.searchParams.get('maxDuration') || 0);
  const platform = req.nextUrl.searchParams.get('platform') || 'all';

  const items = await fetchInspirationFeed({
    minViews: minViews || undefined,
    maxDuration: maxDuration || undefined,
    platform,
  });

  return NextResponse.json({
    items,
    disclaimer:
      'This content is created by third parties and shown for inspiration purposes only. Vesper does not download or re-host any videos.',
  });
}
