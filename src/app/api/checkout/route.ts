import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import {
  getStripePriceIdForPlan,
  isPaidPlan,
  PLAN_AMOUNT_CENTS,
  PLAN_LABELS,
} from '@/lib/stripePlans';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    const { plan } = await req.json();

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isPaidPlan(plan)) {
      return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 400 });
    }

    const priceId = getStripePriceIdForPlan(plan);
    if (!priceId) {
      console.error('[STRIPE_ERROR] Missing price ID for plan:', plan);
      return NextResponse.json(
        { error: `${PLAN_LABELS[plan]} billing is not configured yet. Please contact support.` },
        { status: 400 }
      );
    }

    const stripePrice = await stripe.prices.retrieve(priceId);
    const expectedAmount = PLAN_AMOUNT_CENTS[plan];
    if (stripePrice.unit_amount !== expectedAmount) {
      console.error(
        `[STRIPE_ERROR] Price ID ${priceId} for ${plan} is ${stripePrice.unit_amount} cents; expected ${expectedAmount}. Check STRIPE_PRICE_ID_* env vars.`
      );
      return NextResponse.json(
        {
          error: `${PLAN_LABELS[plan]} checkout is misconfigured. Please contact support.`,
        },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('[STRIPE_ERROR] Missing NEXT_PUBLIC_APP_URL');
      return NextResponse.json(
        { error: 'Application URL configuration error.' },
        { status: 500 }
      );
    }

    await connectDB();

    let dbUser = await User.findOne({ clerkId: userId });
    if (!dbUser) {
      dbUser = await User.create({
        clerkId: userId,
        plan: 'free',
        usageCount: 0,
      });
    }

    let customerId = dbUser.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.emailAddresses[0].emailAddress,
        metadata: { clerkId: userId },
      });
      customerId = customer.id;
      dbUser.stripeCustomerId = customerId;
      await dbUser.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/#pricing?canceled=true`,
      metadata: {
        clerkId: userId,
        plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    const msg = error instanceof Error ? error.message : 'Internal Error';
    return NextResponse.json({ error: `Stripe Error: ${msg}` }, { status: 500 });
  }
}
