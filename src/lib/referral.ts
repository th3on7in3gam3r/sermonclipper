import { randomBytes } from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export function generateReferralCode(): string {
  return randomBytes(4).toString('hex');
}

/** Extend referrer subscription by 30 days when a referred user upgrades (Stripe). */
export async function rewardReferrerOnUpgrade(upgradedClerkId: string): Promise<void> {
  await connectDB();
  const upgraded = await User.findOne({ clerkId: upgradedClerkId });
  if (!upgraded?.referredBy) return;

  const referrer = await User.findOne({ clerkId: upgraded.referredBy });
  if (!referrer) return;

  referrer.referralUpgradeCount = (referrer.referralUpgradeCount || 0) + 1;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey && referrer.stripeSubscriptionId) {
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeKey);
      const sub = await stripe.subscriptions.retrieve(referrer.stripeSubscriptionId);
      const trialEnd = Math.max(
        Math.floor(Date.now() / 1000),
        (sub.trial_end || Math.floor(Date.now() / 1000)) + 30 * 86400
      );
      await stripe.subscriptions.update(referrer.stripeSubscriptionId, { trial_end: trialEnd });
      referrer.referralRewarded = true;
    } catch (err) {
      console.error('[Referral] Stripe reward failed:', err);
    }
  }

  await referrer.save();
}
