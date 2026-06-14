import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sermon from '@/models/Sermon';
import User from '@/models/User';
import { sendQuoteOfTheWeekEmail } from '@/lib/email';
import { collectWeeklyQuotes } from '@/lib/email/quoteOfTheWeek';

/** Weekly email with top 3 quotable moments from clips created that week. */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await connectDB();

  const sermons = await Sermon.find({ createdAt: { $gte: weekAgo } })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  const byUser = new Map<string, typeof sermons>();
  for (const sermon of sermons) {
    if (!sermon.userId) continue;
    const list = byUser.get(sermon.userId) || [];
    list.push(sermon);
    byUser.set(sermon.userId, list);
  }

  let sent = 0;
  for (const [userId, userSermons] of byUser) {
    const dbUser = await User.findOne({ clerkId: userId }).lean();
    if (!dbUser?.email || dbUser.emailUnsubscribed) continue;
    if (dbUser.quoteOfWeekSentAt && dbUser.quoteOfWeekSentAt >= weekAgo) continue;

    const quotes = collectWeeklyQuotes(userSermons);
    if (quotes.length === 0) continue;

    try {
      await sendQuoteOfTheWeekEmail(dbUser.email, quotes, dbUser.emailUnsubscribeToken);
      await User.updateOne({ clerkId: userId }, { $set: { quoteOfWeekSentAt: new Date() } });
      sent += 1;
    } catch (err) {
      console.error('[Quote of week]', userId, err);
    }
  }

  return NextResponse.json({ ok: true, users: byUser.size, sent });
}
