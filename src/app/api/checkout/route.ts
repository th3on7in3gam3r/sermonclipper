import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    const { priceId, plan } = await req.json();

    if (!userId || !user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectDB();

    // 1. Get or Create Internal User
    let dbUser = await User.findOne({ clerkId: userId });
    if (!dbUser) {
      dbUser = await User.create({
        clerkId: userId,
        plan: 'free',
        usageCount: 0,
      });
    }

    // 2. Get or Create Stripe Customer
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

    // 3. Create Checkout Session
    if (!priceId) {
      console.error('[STRIPE_ERROR] Missing Price ID for plan:', plan);
      return new NextResponse('Stripe Price ID is missing. Please check your environment variables.', { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('[STRIPE_ERROR] Missing NEXT_PUBLIC_APP_URL');
      return new NextResponse('Application URL configuration error. Please check your environment variables.', { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/#pricing?canceled=true`,
      metadata: {
        clerkId: userId,
        plan: plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    // Return a more descriptive error if possible
    const message = error?.raw?.message || error.message || 'Internal Error';
    return new NextResponse(`Stripe Error: ${message}`, { status: 500 });
  }
}
