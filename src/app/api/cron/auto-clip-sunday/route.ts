import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { createQueuedJob, triggerJobProcessor } from '@/lib/jobQueue';

/** Monday morning: auto-clip Sunday stream for opted-in users. */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const users = await User.find({
    autoClipSundayStream: true,
    'youtubeTokens.access_token': { $exists: true },
  }).limit(100);

  const origin = req.nextUrl.origin;
  let queued = 0;

  for (const dbUser of users) {
    try {
      const streamsRes = await fetch(`${origin}/api/youtube/recent-streams`, {
        headers: { Cookie: '' },
      });
      // Use internal YouTube API logic directly in future; for now queue a notification job placeholder
      const jobId = await createQueuedJob(dbUser.clerkId, {
        type: 'auto_clip_sunday',
        userId: dbUser.clerkId,
      });
      triggerJobProcessor(jobId, origin);
      queued += 1;

      const Notification = (await import('@/models/Notification')).default;
      await Notification.create({
        userId: dbUser.clerkId,
        type: 'auto_clip',
        message: 'Your Sunday clips are being analyzed — we will notify you when the top 3 are ready.',
        read: false,
      });
    } catch (err) {
      console.error('[Auto-clip Sunday]', dbUser.clerkId, err);
    }
  }

  return NextResponse.json({ ok: true, queued });
}
