import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendWelcomeEmail } from '@/lib/email';
import { PLAN_LIMITS } from '@/lib/plans';
import { generateReferralCode } from '@/lib/referral';
import { isVesperAdmin } from '@/lib/adminBypass';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  const clerkUser = await currentUser();

  if (!userId || !clerkUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const refCode = req.nextUrl.searchParams.get('ref')?.trim();

  await connectDB();
  let dbUser = await User.findOne({ clerkId: userId });
  const isNewUser = !dbUser;

  if (!dbUser) {
    dbUser = await User.create({
      clerkId: userId,
      plan: 'free',
      usageCount: 0,
      onboardingComplete: false,
      referralCode: generateReferralCode(),
    });
  }

  if (!dbUser.referralCode) {
    dbUser.referralCode = generateReferralCode();
  }

  if (isNewUser && refCode && !dbUser.referredBy) {
    const referrer = await User.findOne({ referralCode: refCode });
    if (referrer && referrer.clerkId !== userId) {
      dbUser.referredBy = referrer.clerkId;
    }
  }

  dbUser.lastActiveAt = new Date();

  const email = clerkUser.emailAddresses?.[0]?.emailAddress;
  const name = clerkUser.firstName || 'there';

  if (email && dbUser.email !== email) {
    dbUser.email = email;
  }

  await dbUser.save();

  if (email && !dbUser.welcomeEmailSent && !dbUser.emailUnsubscribed) {
    try {
      await sendWelcomeEmail(email, name, dbUser.emailUnsubscribeToken);
      dbUser.welcomeEmailSent = true;
      await dbUser.save();
    } catch (err) {
      console.error('[User status] Welcome email failed:', err);
    }
  }

  const isAdmin = isVesperAdmin(userId, clerkUser);

  const base = {
    usageCount: dbUser.usageCount,
    youtubeConnected: !!dbUser.youtubeTokens,
    onboardingComplete: isAdmin ? true : (dbUser.onboardingComplete ?? false),
    isNewUser,
    referralCode: dbUser.referralCode,
    isAdmin,
  };

  if (isAdmin) {
    return NextResponse.json({
      ...base,
      plan: 'church_pro',
      status: 'active',
      limit: 999999,
    });
  }

  const limit = PLAN_LIMITS[dbUser.plan] ?? PLAN_LIMITS.free;

  return NextResponse.json({
    ...base,
    plan: dbUser.plan,
    status: dbUser.status,
    limit,
    lastUsageReset: dbUser.lastUsageReset,
  });
}
