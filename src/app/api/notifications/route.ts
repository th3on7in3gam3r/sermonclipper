import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(30).lean();
  const unreadCount = await Notification.countDocuments({ userId, read: false });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, markAllRead } = await req.json();
  await connectDB();

  if (markAllRead) {
    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
    return NextResponse.json({ success: true });
  }

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  await Notification.updateOne({ _id: id, userId }, { $set: { read: true } });
  return NextResponse.json({ success: true });
}
