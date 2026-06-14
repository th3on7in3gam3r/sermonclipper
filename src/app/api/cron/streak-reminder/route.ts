import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Sermon from '@/models/Sermon';
import { createNotification } from '@/lib/notifications';
import { isoWeekKey } from '@/lib/gamification';

/** Friday reminder when no clip created this week. */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const day = new Date().getUTCDay();
  if (day !== 5 && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ skipped: true, reason: 'Not Friday' });
  }

  await connectDB();
  const week = isoWeekKey();
  const weekStart = new Date();
  weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 2) % 7));
  weekStart.setUTCHours(0, 0, 0, 0);

  const users = await User.find({
    'gamification.currentStreak': { $gte: 1 },
    'gamification.lastClipWeek': { $ne: week },
  })
    .limit(500)
    .lean();

  let sent = 0;
  for (const user of users) {
    const recent = await Sermon.findOne({
      userId: user.clerkId,
      createdAt: { $gte: weekStart },
    }).lean();
    if (recent) continue;

    await createNotification({
      userId: user.clerkId,
      type: 'streak_reminder',
      message: "Keep your streak alive — this week's sermon is waiting",
      link: '/#upload',
      pushTitle: 'Weekly streak',
    });
    sent += 1;
  }

  return NextResponse.json({ ok: true, candidates: users.length, sent });
}
