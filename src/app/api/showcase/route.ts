import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sermon from '@/models/Sermon';
import User from '@/models/User';

export async function GET() {
  await connectDB();

  const optedInUsers = await User.find({ showcaseOptIn: true }).select('clerkId whiteLabel').lean();
  const userIds = optedInUsers.map((u) => u.clerkId);
  if (!userIds.length) {
    return NextResponse.json({ clips: [] });
  }

  const sermons = await Sermon.find({ userId: { $in: userIds } })
    .sort({ createdAt: -1 })
    .limit(40)
    .lean();

  const userMap = new Map(optedInUsers.map((u) => [u.clerkId, u]));

  const clips: {
    clipId: string;
    churchName: string;
    caption: string;
    videoUrl: string;
    thumbnailUrl?: string;
  }[] = [];

  for (const sermon of sermons) {
    const analysis = sermon.analysis as { clips?: { hook_title?: string; main_quote?: string }[] } | undefined;
    const churchName =
      (userMap.get(sermon.userId)?.whiteLabel as { churchName?: string } | undefined)?.churchName ||
      sermon.title;

    analysis?.clips?.slice(0, 2).forEach((clip, clipIndex) => {
      if (clips.length >= 24) return;
      clips.push({
        clipId: `${sermon.jobId}-${clipIndex}`,
        churchName,
        caption: clip.hook_title || clip.main_quote || sermon.title,
        videoUrl: sermon.finalPath || sermon.videoUrl,
        thumbnailUrl: undefined,
      });
    });
  }

  return NextResponse.json({ clips: clips.slice(0, 24) });
}
