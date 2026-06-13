import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendWelcomeEmail } from '@/lib/email';
import { PLAN_LIMITS } from '@/lib/plans';

export async function GET() {
  const { userId } = await auth();
  const clerkUser = await currentUser();

  if (!userId || !clerkUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  await connectDB();
  let dbUser = await User.findOne({ clerkId: userId });
  const isNewUser = !dbUser;

  if (!dbUser) {
    dbUser = await User.create({ clerkId: userId, plan: 'free', usageCount: 0, onboardingComplete: false });
  }

  const email = clerkUser.emailAddresses?.[0]?.emailAddress;
  const name = clerkUser.firstName || 'there';

  if (email && dbUser.email !== email) {
    dbUser.email = email;
    await dbUser.save();
  }

  if (email && !dbUser.welcomeEmailSent && !dbUser.emailUnsubscribed) {
    try {
      await sendWelcomeEmail(email, name, dbUser.emailUnsubscribeToken);
      dbUser.welcomeEmailSent = true;
      await dbUser.save();
    } catch (err) {
      console.error('[User status] Welcome email failed:', err);
    }
  }

  // DIVINE BYPASS: Hardcode specific admins to Church Pro
  const isAdmin =
    userId === 'user_3DYwuXu2bJd40YjKuyIoEh0Mvm4' ||
    clerkUser.emailAddresses.some((e) => e.emailAddress.includes('yahweh')) ||
    clerkUser.emailAddresses.some((e) => e.emailAddress.includes('theonlinegamer')) ||
    clerkUser.firstName?.toLowerCase().includes('jerless');

  if (isAdmin) {
    return NextResponse.json({
      plan: 'church_pro',
      status: 'active',
      usageCount: dbUser.usageCount,
      limit: 999999,
      youtubeConnected: !!dbUser.youtubeTokens,
      onboardingComplete: true,
      isAdmin: true,
      isNewUser,
    });
  }

  const limit = PLAN_LIMITS[dbUser.plan] ?? PLAN_LIMITS.free;

  return NextResponse.json({
    plan: dbUser.plan,
    status: dbUser.status,
    usageCount: dbUser.usageCount,
    limit,
    lastUsageReset: dbUser.lastUsageReset,
    youtubeConnected: !!dbUser.youtubeTokens,
    onboardingComplete: dbUser.onboardingComplete ?? false,
    isNewUser,
  });
}
