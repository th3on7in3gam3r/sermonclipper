import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const dbUser = await User.findOne({ clerkId: userId });
  if (!dbUser) return NextResponse.json({ connections: {} });

  const tokens = (dbUser.youtubeTokens || {}) as Record<string, unknown>;
  const social = dbUser.socialConnections || {};

  return NextResponse.json({
    connections: {
      youtube: !!tokens.access_token,
      instagram: !!social.instagram,
      tiktok: !!social.tiktok,
    },
  });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const platform = req.nextUrl.searchParams.get('platform');
  if (!platform) return NextResponse.json({ error: 'Missing platform' }, { status: 400 });

  await connectDB();
  const dbUser = await User.findOne({ clerkId: userId });
  if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (platform === 'youtube') {
    dbUser.youtubeTokens = undefined;
  } else {
    const social = { ...(dbUser.socialConnections || {}) };
    delete social[platform];
    dbUser.socialConnections = social;
  }

  await dbUser.save();
  return NextResponse.json({ ok: true });
}
