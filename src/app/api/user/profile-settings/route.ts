import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ clerkId: userId }).lean();
  return NextResponse.json({
    bioPage: user?.bioPage || {},
    showcaseOptIn: user?.showcaseOptIn || false,
    autoClipSundayStream: user?.autoClipSundayStream || false,
  });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const update: Record<string, unknown> = {};

  if (body.bioPage !== undefined) {
    const username = body.bioPage.username?.trim()?.toLowerCase();
    if (username) {
      await connectDB();
      const taken = await User.findOne({
        'bioPage.username': username,
        clerkId: { $ne: userId },
      });
      if (taken) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
    }
    update.bioPage = body.bioPage;
  }
  if (typeof body.showcaseOptIn === 'boolean') update.showcaseOptIn = body.showcaseOptIn;
  if (typeof body.autoClipSundayStream === 'boolean') update.autoClipSundayStream = body.autoClipSundayStream;

  await connectDB();
  await User.findOneAndUpdate({ clerkId: userId }, { $set: update });

  return NextResponse.json({ ok: true });
}
