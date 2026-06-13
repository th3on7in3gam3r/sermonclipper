import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getDueOnboardingDays, sendOnboardingEmail } from '@/lib/email/onboardingSequence';

/** Vercel Cron: send onboarding drip emails — schedule daily, protect with CRON_SECRET. */
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
  }).limit(300);

  let sent = 0;
  for (const dbUser of users) {
    if (!dbUser.email) continue;
    const sentDays = dbUser.onboardingEmailsSent || [];
    const dueDays = getDueOnboardingDays(dbUser.createdAt, sentDays);
    if (!dueDays.length) continue;

    const clipCount = await Sermon.countDocuments({ userId: dbUser.clerkId });
    const name = dbUser.email.split('@')[0] || 'there';

    for (const day of dueDays) {
      try {
        const result = await sendOnboardingEmail(dbUser.email, day, {
          plan: dbUser.plan,
          clipCount,
          name,
          unsubscribeToken: dbUser.emailUnsubscribeToken,
        });
        if (result.ok) {
          dbUser.onboardingEmailsSent = [...(dbUser.onboardingEmailsSent || []), day];
          sent += 1;
        } else if (result.skipped) {
          dbUser.onboardingEmailsSent = [...(dbUser.onboardingEmailsSent || []), day];
        }
      } catch (err) {
        console.error('[Onboarding email] Failed for', dbUser.clerkId, day, err);
      }
    }
    await dbUser.save();
  }

  return NextResponse.json({ ok: true, sent });
}
