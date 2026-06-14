import { currentUser } from '@clerk/nextjs/server';
import User from '@/models/User';
import { PLAN_LIMITS, formatResetDate, getUsageResetDate } from '@/lib/plans';
import { sendQuotaReachedEmail, sendQuotaWarningEmail } from '@/lib/email';
import { createNotification } from '@/lib/notifications';

export async function maybeSendQuotaEmails(dbUser: InstanceType<typeof User>) {
  if (dbUser.emailUnsubscribed) return;

  const limit = PLAN_LIMITS[dbUser.plan] ?? PLAN_LIMITS.free;
  if (limit >= 999999) return;

  const used = dbUser.usageCount;
  const pct = used / limit;
  const resetDate = formatResetDate(getUsageResetDate(dbUser.lastUsageReset));

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
  if (!email) return;

  const token = dbUser.emailUnsubscribeToken;
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;

  if (pct >= 1) {
    const reachedKey = dbUser.quotaReachedSentAt
      ? `${dbUser.quotaReachedSentAt.getFullYear()}-${dbUser.quotaReachedSentAt.getMonth()}`
      : null;
    if (reachedKey !== monthKey) {
      await sendQuotaReachedEmail(email, { resetDate }, token, dbUser.whiteLabel);
      dbUser.quotaReachedSentAt = now;
      await dbUser.save();
    }
    return;
  }

  if (pct >= 0.8) {
    const warningKey = dbUser.quotaWarningSentAt
      ? `${dbUser.quotaWarningSentAt.getFullYear()}-${dbUser.quotaWarningSentAt.getMonth()}`
      : null;
    if (warningKey !== monthKey) {
      await sendQuotaWarningEmail(email, { used, limit, resetDate }, token, dbUser.whiteLabel);
      dbUser.quotaWarningSentAt = now;
      await dbUser.save();
      await createNotification({
        userId: dbUser.clerkId,
        type: 'quota_warning',
        message: `You've used ${Math.round(pct * 100)}% of your clips this month`,
        link: '/dashboard#quota',
        pushTitle: 'Clip quota warning',
      });
    }
  }
}
