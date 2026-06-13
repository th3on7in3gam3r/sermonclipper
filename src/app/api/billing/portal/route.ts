import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { stripe } from '@/lib/stripe';
import { SITE_URL } from '@/lib/siteConfig';

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  let dbUser = await User.findOne({ clerkId: userId });
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (!dbUser.stripeCustomerId) {
    return NextResponse.json({ error: 'Subscribe to a paid plan first to manage billing.' }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId,
    return_url: `${SITE_URL}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
