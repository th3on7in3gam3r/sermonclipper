import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { platform, videoUrl, title, description } = await req.json();
  if (!platform || !videoUrl) {
    return NextResponse.json({ error: 'Missing platform or videoUrl' }, { status: 400 });
  }

  if (platform === 'youtube') {
    await connectDB();
    const dbUser = await User.findOne({ clerkId: userId });
    if (!dbUser?.youtubeTokens) {
      return NextResponse.json(
        { error: 'Connect YouTube in Settings first.', code: 'NOT_CONNECTED' },
        { status: 403 }
      );
    }

    const uploadRes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://vesper.biblefunland.com'}/api/youtube/upload`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: req.headers.get('cookie') || '',
        },
        body: JSON.stringify({ videoUrl, title, description: description || title }),
      }
    );

    const data = await uploadRes.json();
    if (!uploadRes.ok) {
      return NextResponse.json(
        { error: data.error || 'YouTube upload failed. Download the MP4 instead.' },
        { status: uploadRes.status }
      );
    }

    try {
      const { awardMilestone, notifyMilestoneUnlocks } = await import('@/lib/gamification');
      const unlocked = await awardMilestone(userId, 'first_social_post');
      await notifyMilestoneUnlocks(userId, unlocked);
    } catch {
      /* non-blocking */
    }

    return NextResponse.json({
      postUrl: data.url || `https://youtube.com/shorts/${data.videoId}`,
      videoId: data.videoId,
    });
  }

  return NextResponse.json(
    {
      error: `${platform} API is not configured. Download the MP4 and upload manually.`,
    },
    { status: 501 }
  );
}
