import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { google } from 'googleapis';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/youtube/callback`
);

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const dbUser = await User.findOne({ clerkId: userId });
  if (!dbUser?.youtubeTokens) {
    return NextResponse.json({ youtubeConnected: false, variants: [], aggregateInsight: null });
  }

  const clipIndex = Number(req.nextUrl.searchParams.get('clipIndex') ?? 0);
  const records = (dbUser.youtubeThumbnailTests || []).filter(
    (r: { clipIndex?: number }) => (r.clipIndex ?? 0) === clipIndex
  );

  oauth2Client.setCredentials(dbUser.youtubeTokens as Record<string, string>);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  const variants: {
    id: string;
    imageUrl: string;
    ctr: number;
    views: number;
    isWinner?: boolean;
  }[] = [];

  for (const rec of records) {
    try {
      const stats = await youtube.videos.list({
        part: ['statistics', 'snippet'],
        id: [rec.videoId],
      });
      const video = stats.data.items?.[0];
      const views = Number(video?.statistics?.viewCount || 0);
      variants.push({
        id: rec.videoId,
        imageUrl: rec.thumbnailUrl || video?.snippet?.thumbnails?.high?.url || '',
        ctr: rec.ctr ?? 0,
        views,
      });
    } catch {
      /* skip unavailable videos */
    }
  }

  if (variants.length >= 2) {
    const best = variants.reduce((a, b) => (b.ctr > a.ctr ? b : a));
    best.isWinner = true;
  }

  const allTests = dbUser.youtubeThumbnailTests || [];
  const withText = allTests.filter((t: { hasTextOverlay?: boolean; ctr?: number }) => t.hasTextOverlay);
  const withoutText = allTests.filter((t: { hasTextOverlay?: boolean; ctr?: number }) => !t.hasTextOverlay);
  const avgText =
    withText.length > 0 ? withText.reduce((s: number, t: { ctr?: number }) => s + (t.ctr || 0), 0) / withText.length : 0;
  const avgPlain =
    withoutText.length > 0
      ? withoutText.reduce((s: number, t: { ctr?: number }) => s + (t.ctr || 0), 0) / withoutText.length
      : 0;

  let aggregateInsight: string | null = null;
  if (withText.length >= 2 && withoutText.length >= 2 && avgPlain > 0) {
    const lift = Math.round(((avgText - avgPlain) / avgPlain) * 100);
    if (lift > 0) {
      aggregateInsight = `Text overlays on thumbnails get ${lift}% higher CTR on your channel — calculated from your own data.`;
    }
  }

  return NextResponse.json({ youtubeConnected: true, variants, aggregateInsight });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clipIndex } = await req.json();
  await connectDB();
  const dbUser = await User.findOne({ clerkId: userId });
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const records = (dbUser.youtubeThumbnailTests || []).filter(
    (r: { clipIndex?: number }) => (r.clipIndex ?? 0) === clipIndex
  );
  const winner = records.reduce(
    (best: { ctr?: number; style?: Record<string, unknown> } | null, r: { ctr?: number; style?: Record<string, unknown> }) =>
      !best || (r.ctr || 0) > (best.ctr || 0) ? r : best,
    null
  );

  if (!winner?.style) {
    return NextResponse.json({ error: 'No winning thumbnail style found' }, { status: 400 });
  }

  dbUser.whiteLabel = {
    ...(dbUser.whiteLabel || {}),
    defaultThumbnailStyle: winner.style,
  };
  await dbUser.save();

  return NextResponse.json({
    message: 'Winning thumbnail pattern saved to your Brand Kit defaults.',
    ok: true,
    defaultThumbnailStyle: winner.style,
  });
}
