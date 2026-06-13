import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ success: true, onboardingComplete: true });
    }

    await connectDB();
    const dbUser = await User.findOneAndUpdate(
      { clerkId: userId },
      { onboardingComplete: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      onboardingComplete: dbUser?.onboardingComplete ?? true,
    });
  } catch (error) {
    console.error('[Onboarding API] Error:', error);
    return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 });
  }
}
