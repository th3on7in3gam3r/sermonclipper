import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Sermon from '@/models/Sermon';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const admin = await User.findOne({ clerkId: userId, networkRole: 'admin' });
  if (!admin?.networkId) {
    return NextResponse.json({ error: 'Network admin access required' }, { status: 403 });
  }

  const churches = await User.find({ networkId: admin.networkId, networkRole: 'church' })
    .select('clerkId email lastActiveAt usageCount plan')
    .lean();

  const churchIds = churches.map((c) => c.clerkId);
  const totalClips = await Sermon.countDocuments({ userId: { $in: churchIds } });

  return NextResponse.json({
    stats: {
      totalClips,
      totalExports: 0,
      churches,
    },
  });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 });

  await connectDB();
  const admin = await User.findOne({ clerkId: userId, networkRole: 'admin' });
  if (!admin?.networkId) {
    return NextResponse.json({ error: 'Network admin access required' }, { status: 403 });
  }

  const churches = await User.find({ networkId: admin.networkId, networkRole: 'church' }).select('clerkId');
  const Notification = (await import('@/models/Notification')).default;

  await Promise.all(
    churches.map((c) =>
      Notification.create({
        userId: c.clerkId,
        type: 'network_announcement',
        message: message.trim(),
        read: false,
      })
    )
  );

  return NextResponse.json({ ok: true, sent: churches.length });
}
