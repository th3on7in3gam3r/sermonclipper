import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  await connectDB();
  let dbUser = await User.findOne({ clerkId: userId });
  
  if (!dbUser) {
    dbUser = await User.create({ clerkId: userId, plan: 'free', usageCount: 0 });
  }

  return NextResponse.json({
    plan: dbUser.plan,
    status: dbUser.status,
    usageCount: dbUser.usageCount,
    limit: dbUser.plan === 'free' ? 2 : dbUser.plan === 'creator' ? 20 : 999999,
    youtubeConnected: !!dbUser.youtubeTokens
  });
}
