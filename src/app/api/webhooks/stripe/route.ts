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
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (!session?.metadata?.clerkId) return new NextResponse('Missing metadata', { status: 400 });

    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

    await connectDB();
    await User.findOneAndUpdate(
      { clerkId: session.metadata.clerkId },
      {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        plan: session.metadata.plan,
        status: 'active',
      }
    );
  }

  // Handle successful payments
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;
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
