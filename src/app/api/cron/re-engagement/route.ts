import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendReEngagementEmail, type ReEngagementSegment } from '@/lib/email/reEngagement';

/** Vercel Cron: re-engagement segments — protect with CRON_SECRET. */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const Sermon = (await import('@/models/Sermon')).default;

  const users = await User.find({
    emailUnsubscribed: { $ne: true },
    email: { $exists: true, $ne: null },
  }).limit(400);

  let sent = 0;
  const now = Date.now();

  for (const dbUser of users) {
    if (!dbUser.email) continue;
    const sentTags: string[] = (dbUser as { reEngagementSent?: string[] }).reEngagementSent || [];
    const clipCount = await Sermon.countDocuments({ userId: dbUser.clerkId });
    const name = dbUser.email.split('@')[0] || 'there';
    const ageDays = Math.floor((now - dbUser.createdAt.getTime()) / 86400000);

    const ctx = {
      plan: dbUser.plan,
      clipCount,
      name,
      unsubscribeToken: dbUser.emailUnsubscribeToken,
      lastActiveAt: dbUser.lastActiveAt,
      usageCount: dbUser.usageCount,
      cancelFeedback: dbUser.cancelFeedback as { at?: Date } | undefined,
    };

    const segments: { segment: ReEngagementSegment; dayGate: number }[] = [
      { segment: 'never_created_clip', dayGate: 7 },
      { segment: 'inactive_30d', dayGate: 30 },
      { segment: 'quota_reset', dayGate: 30 },
      { segment: 'churned_winback', dayGate: 30 },
    ];

    for (const { segment, dayGate } of segments) {
      const tag = segment;
      if (sentTags.includes(tag)) continue;

      if (segment === 'never_created_clip' && ageDays < 7) continue;
      if (segment === 'inactive_30d' && ageDays < 30) continue;
      if (segment === 'churned_winback') {
        const canceledAt = ctx.cancelFeedback?.at;
        if (!canceledAt) continue;
        const daysSinceCancel = (now - new Date(canceledAt).getTime()) / 86400000;
        if (daysSinceCancel < 30) continue;
      }
      if (segment === 'quota_reset') {
        const reset = dbUser.lastUsageReset;
        if (!reset) continue;
        const daysSinceReset = (now - reset.getTime()) / 86400000;
        if (daysSinceReset > 1.5) continue;
        if (dbUser.plan !== 'free') continue;
      }

      try {
        const result = await sendReEngagementEmail(dbUser.email, segment, ctx);
        if (result.ok || result.skipped) {
          await User.updateOne({ clerkId: dbUser.clerkId }, { $addToSet: { reEngagementSent: tag } });
          if (result.ok) sent += 1;
        }
      } catch (err) {
        console.error('[Re-engagement]', segment, dbUser.clerkId, err);
      }
    }
  }

  return NextResponse.json({ ok: true, sent });
}
