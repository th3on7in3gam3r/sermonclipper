import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { SITE_URL } from '@/lib/siteConfig';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const user = await User.findOne({ clerkId: userId });
  if (!user?.referralCode) {
    return NextResponse.json({ error: 'Referral code not ready' }, { status: 404 });
  }

  const referred = await User.countDocuments({ referredBy: userId });
  const upgrades = user.referralUpgradeCount || 0;
  const monthsEarned = upgrades;

  const link = `${SITE_URL}/?ref=${user.referralCode}`;
  const shareMessage = `I've been using Vesper to turn our sermons into reels — it's incredible. Try it free: ${link}`;

  return NextResponse.json({
    referralCode: user.referralCode,
    link,
    shareMessage,
    stats: { referred, upgrades, monthsEarned },
  });
}
