import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const DEFAULT_CHECKLIST = {
  uploadedSermon: false,
  createdClip: false,
  customizedCaption: false,
  exportedReel: false,
  connectedSocial: false,
  invitedTeamMember: false,
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ clerkId: userId }).lean();
  const checklist = { ...DEFAULT_CHECKLIST, ...(user?.checklist || {}) };
  const completed = Object.values(checklist).filter(Boolean).length;
  const total = Object.keys(checklist).length;

  return NextResponse.json({ checklist, completed, total, plan: user?.plan || 'free' });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { key, value } = await req.json();
  const validKeys = Object.keys(DEFAULT_CHECKLIST);
  if (!validKeys.includes(key)) {
    return NextResponse.json({ error: 'Invalid checklist key' }, { status: 400 });
  }

  await connectDB();
  await User.updateOne({ clerkId: userId }, { $set: { [`checklist.${key}`]: Boolean(value) } });
  return NextResponse.json({ success: true });
}
