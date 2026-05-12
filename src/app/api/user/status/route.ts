import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  const { userId } = await auth();
  const clerkUser = await currentUser();

  if (!userId || !clerkUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  await connectDB();
  let dbUser = await User.findOne({ clerkId: userId });
  
  if (!dbUser) {
    dbUser = await User.create({ clerkId: userId, plan: 'free', usageCount: 0 });
  }

  // DIVINE BYPASS: Hardcode specific admins to Church Pro
  const isAdmin = 
    userId === 'user_3DYwuXu2bJd40YjKuyIoEh0Mvm4' ||
    clerkUser.emailAddresses.some(e => e.emailAddress.includes('yahweh')) || 
    clerkUser.emailAddresses.some(e => e.emailAddress.includes('theonlinegamer')) ||
    clerkUser.firstName?.toLowerCase().includes('jerless');

  if (isAdmin) {
    return NextResponse.json({
      plan: 'church_pro',
      status: 'active',
      usageCount: dbUser.usageCount,
      limit: 999999,
      youtubeConnected: !!dbUser.youtubeTokens,
      isAdmin: true
    });
  }

  return NextResponse.json({
    plan: dbUser.plan,
    status: dbUser.status,
    usageCount: dbUser.usageCount,
    limit: dbUser.plan === 'free' ? 2 : dbUser.plan === 'creator' ? 20 : 999999,
    youtubeConnected: !!dbUser.youtubeTokens
  });
}
