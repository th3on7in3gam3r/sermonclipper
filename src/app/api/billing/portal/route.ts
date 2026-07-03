import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import type Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { stripe } from '@/lib/stripe';
import { SITE_URL } from '@/lib/siteConfig';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let cancel = false;
  try {
    const body = await req.json();
    cancel = body?.cancel === true;
  } catch {
    /* empty body is fine */
  }

  await connectDB();
  const dbUser = await User.findOne({ clerkId: userId });
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (!dbUser.stripeCustomerId) {
    return NextResponse.json({ error: 'Subscribe to a paid plan first to manage billing.' }, { status: 400 });
  }

  try {
    const sessionParams: Stripe.BillingPortal.SessionCreateParams = {
      customer: dbUser.stripeCustomerId,
      return_url: `${SITE_URL}/dashboard/billing`,
    };

    if (cancel) {
      let subscriptionId = dbUser.stripeSubscriptionId;
      if (!subscriptionId) {
        const subs = await stripe.subscriptions.list({
          customer: dbUser.stripeCustomerId,
          status: 'active',
          limit: 1,
        });
        subscriptionId = subs.data[0]?.id;
      }

      if (!subscriptionId) {
        return NextResponse.json({ error: 'No active subscription found to cancel.' }, { status: 400 });
      }

      sessionParams.flow_data = {
        type: 'subscription_cancel',
        subscription_cancel: { subscription: subscriptionId },
      };
    }

    const session = await stripe.billingPortal.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[Billing portal]', err);
    const message =
      err instanceof Error && err.message.includes('billing portal')
        ? 'Stripe billing portal is not configured yet. Please contact support.'
        : 'Could not open billing portal. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
