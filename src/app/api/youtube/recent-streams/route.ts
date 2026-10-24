import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { youtubeFor } from '@/lib/google/youtubeClient';

/** Last 5 live/broadcast streams from the connected YouTube channel. */
export async function GET(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ streams: [], connected: false });
  }

  await connectDB();
  const dbUser = await User.findOne({ clerkId: userId });
  const tokens = dbUser?.youtubeTokens as Record<string, unknown> | undefined;
  if (!tokens?.access_token) {
    return NextResponse.json({ streams: [], connected: false });
  }

  try {
    const youtube = youtubeFor(tokens);

    const channelRes = await youtube.channels.list({
      part: ['contentDetails'],
      mine: true,
    });
    const uploadsPlaylist =
      channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylist) {
      return NextResponse.json({ streams: [], connected: true });
    }

    const playlistRes = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId: uploadsPlaylist,
      maxResults: 25,
    });

    const items = playlistRes.data.items || [];
    const streams = items
      .filter((item) => {
        const title = item.snippet?.title?.toLowerCase() || '';
        return title.includes('live') || title.includes('stream') || title.includes('sunday');
      })
      .slice(0, 5)
      .map((item) => ({
        videoId: item.contentDetails?.videoId,
        title: item.snippet?.title,
        url: `https://www.youtube.com/watch?v=${item.contentDetails?.videoId}`,
        publishedAt: item.snippet?.publishedAt,
      }))
      .filter((s) => s.videoId);

    return NextResponse.json({ streams, connected: true });
  } catch (err) {
    console.error('[YouTube recent streams]', err);
    return NextResponse.json({ streams: [], connected: true, error: 'Could not load streams' });
  }
}
