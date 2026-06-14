import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchPodcastEpisodesServer } from '@/lib/podcast/parseFeed';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { feedUrl } = await req.json();
  if (!feedUrl || typeof feedUrl !== 'string') {
    return NextResponse.json({ error: 'Feed URL required' }, { status: 400 });
  }

  try {
    const parsed = await fetchPodcastEpisodesServer(feedUrl.trim(), 25);
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to parse feed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
