import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getLatestChangelogDate } from '@/data/changelog';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ hasUnread: false });

  await connectDB();
  const user = await User.findOne({ clerkId: userId }).lean();
  const latest = getLatestChangelogDate();
  const lastSeen = user?.lastSeenChangelogDate
    ? new Date(user.lastSeenChangelogDate).toISOString().slice(0, 10)
    : '';

  return NextResponse.json({ hasUnread: latest > lastSeen, latestDate: latest, lastSeen });
}

export async function PATCH() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  await User.updateOne({ clerkId: userId }, { $set: { lastSeenChangelogDate: new Date() } });
  return NextResponse.json({ success: true });
}
