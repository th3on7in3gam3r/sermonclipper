import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendMonthlyRecapEmail } from '@/lib/email';

/** Vercel Cron: monthly recap on the 1st — set CRON_SECRET in env. */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;
  const monthLabel = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const users = await User.find({
    emailUnsubscribed: { $ne: true },
    email: { $exists: true, $ne: null },
    lastRecapMonth: { $ne: monthKey },
  }).limit(200);

  const Sermon = (await import('@/models/Sermon')).default;
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);

  let sent = 0;
  for (const dbUser of users) {
    const clipCount = await Sermon.countDocuments({
      userId: dbUser.clerkId,
      createdAt: { $gte: start, $lt: end },
    });

    if (clipCount === 0) {
      dbUser.lastRecapMonth = monthKey;
      await dbUser.save();
      continue;
    }

    if (!dbUser.email) continue;

    try {
      await sendMonthlyRecapEmail(
        dbUser.email,
        { monthLabel, clipCount },
        dbUser.emailUnsubscribeToken
      );
      dbUser.lastRecapMonth = monthKey;
      await dbUser.save();
      sent += 1;
    } catch (err) {
      console.error('[Monthly recap] Failed for', dbUser.clerkId, err);
    }
  }

  return NextResponse.json({ ok: true, sent });
}
