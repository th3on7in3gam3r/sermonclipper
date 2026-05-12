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
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    if (!session?.metadata?.clerkId) {
      return new NextResponse('Clerk ID is required', { status: 400 });
    }

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

  // Handle subscription updates/cancellations
  if (event.type === 'invoice.payment_succeeded') {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await connectDB();
    await User.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      {
        plan: subscription.items.data[0].plan.metadata?.plan || 'creator', // Fallback or logic based on price ID
        status: 'active',
      }
    );
  }

  return new NextResponse(null, { status: 200 });
}
