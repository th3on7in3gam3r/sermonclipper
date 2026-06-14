import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import ModerationLog from '@/models/ModerationLog';
import User from '@/models/User';
import { isVesperAdmin } from '@/lib/adminBypass';
import { logAuditEvent } from '@/lib/auditLog';

export async function GET() {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  if (!userId || !isVesperAdmin(userId, clerkUser)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const items = await ModerationLog.find({ status: 'pending_review' })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const userIds = [...new Set(items.map((i) => i.userId))];
  const users = await User.find({ clerkId: { $in: userIds } }).lean();
  const emailMap = Object.fromEntries(users.map((u) => [u.clerkId, u.email]));

  return NextResponse.json({
    queue: items.map((i) => ({
      id: String(i._id),
      userId: i.userId,
      email: emailMap[i.userId],
      jobId: i.jobId,
      outcome: i.outcome,
      reasons: i.reasons,
      createdAt: i.createdAt,
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  if (!userId || !isVesperAdmin(userId, clerkUser)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { id, action } = body as { id?: string; action?: 'approve' | 'remove' };
  if (!id || !action) return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });

  await connectDB();
  const item = await ModerationLog.findById(id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'approve') {
    item.status = 'approved';
    item.reviewedBy = userId;
    item.reviewedAt = new Date();
    await item.save();
    await logAuditEvent({
      userId: item.userId,
      actorId: userId,
      eventType: 'moderation.approved',
      metadata: { moderationId: id },
    });
  } else {
    item.status = 'blocked';
    item.reviewedBy = userId;
    item.reviewedAt = new Date();
    await item.save();
  }

  return NextResponse.json({ success: true });
}
