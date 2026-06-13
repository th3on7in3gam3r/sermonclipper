import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { isVesperAdmin } from '@/lib/adminBypass';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  if (!userId || !isVesperAdmin(userId, clerkUser)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get('q')?.trim() || '';

  await connectDB();
  const filter = q
    ? {
        $or: [
          { email: { $regex: q, $options: 'i' } },
          { clerkId: { $regex: q, $options: 'i' } },
          { referralCode: { $regex: q, $options: 'i' } },
        ],
      }
    : {};

  const users = await User.find(filter).sort({ createdAt: -1 }).limit(100).lean();

  return NextResponse.json({
    users: users.map((u) => ({
      clerkId: u.clerkId,
      email: u.email || '',
      plan: u.plan,
      joined: u.createdAt,
      lastActive: u.lastActiveAt || u.createdAt,
      usageCount: u.usageCount,
      referralCode: u.referralCode,
    })),
  });
}
