import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { savePushSubscription } from '@/lib/push';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const subscription = body?.subscription;
  if (!subscription?.endpoint || !subscription?.keys) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  await savePushSubscription(userId, subscription);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  await User.updateOne({ clerkId: userId }, { $set: { pushPromptDismissed: true } });
  const PushSubscription = (await import('@/models/PushSubscription')).default;
  await PushSubscription.deleteMany({ userId });

  return NextResponse.json({ ok: true });
}
