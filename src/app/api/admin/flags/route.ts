import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import FeatureFlag from '@/models/FeatureFlag';
import { isVesperAdmin } from '@/lib/adminBypass';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  if (!userId || !isVesperAdmin(userId, clerkUser)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const flags = await FeatureFlag.find().sort({ flagName: 1 }).lean();
  return NextResponse.json({ flags });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  if (!userId || !isVesperAdmin(userId, clerkUser)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { flagName, enabled = false, rolloutPercentage = 0 } = await req.json();
  if (!flagName || typeof flagName !== 'string') {
    return NextResponse.json({ error: 'flagName required' }, { status: 400 });
  }

  await connectDB();
  const flag = await FeatureFlag.findOneAndUpdate(
    { flagName },
    { $set: { enabled, rolloutPercentage }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true, new: true }
  );

  return NextResponse.json({ flag });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  if (!userId || !isVesperAdmin(userId, clerkUser)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { flagName, enabled, rolloutPercentage } = await req.json();
  if (!flagName) {
    return NextResponse.json({ error: 'flagName required' }, { status: 400 });
  }

  await connectDB();
  const update: Record<string, unknown> = {};
  if (typeof enabled === 'boolean') update.enabled = enabled;
  if (typeof rolloutPercentage === 'number') update.rolloutPercentage = rolloutPercentage;

  const flag = await FeatureFlag.findOneAndUpdate({ flagName }, { $set: update }, { new: true });
  if (!flag) return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
  return NextResponse.json({ flag });
}
