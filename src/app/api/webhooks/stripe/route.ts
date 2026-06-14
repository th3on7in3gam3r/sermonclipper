import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Webhook Error';
    return new NextResponse(`Webhook Error: ${msg}`, { status: 400 });
  }

  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (!session?.metadata?.clerkId) return new NextResponse('Missing metadata', { status: 400 });

    await connectDB();

    if (session.metadata.type === 'marketplace_template' && session.metadata.templateId) {
      const TemplatePurchase = (await import('@/models/TemplatePurchase')).default;
      const MarketplaceTemplate = (await import('@/models/MarketplaceTemplate')).default;

      await TemplatePurchase.findOneAndUpdate(
        { userId: session.metadata.clerkId, templateId: session.metadata.templateId },
        {
          $set: {
            priceCents: session.amount_total || 0,
            stripeSessionId: session.id,
            purchasedAt: new Date(),
          },
        },
        { upsert: true }
      );

      await MarketplaceTemplate.updateOne(
        { _id: session.metadata.templateId },
        { $inc: { purchaseCount: 1 } }
      );

      return new NextResponse('Template purchase recorded', { status: 200 });
    }

    if (!session.subscription) {
      return new NextResponse('Webhook processed', { status: 200 });
    }

    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

    await User.findOneAndUpdate(
      { clerkId: session.metadata.clerkId },
      {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        plan: session.metadata.plan,
        status: 'active',
      }
    );

    const { rewardReferrerOnUpgrade } = await import('@/lib/referral');
    await rewardReferrerOnUpgrade(session.metadata.clerkId);
  }

  // Handle successful payments
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice & { subscription?: string };
    if (invoice.subscription) {
      await connectDB();
      await User.findOneAndUpdate(
        { stripeSubscriptionId: invoice.subscription as string },
        { status: 'active' }
      );
    }
  }

  // Handle cancellations
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    await connectDB();
    await User.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      { plan: 'free', status: 'canceled' }
    );
  }

  // Handle plan updates
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    await connectDB();
    await User.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      { status: subscription.status === 'active' ? 'active' : 'past_due' }
    );
  }

  return new NextResponse('Webhook processed', { status: 200 });
}
