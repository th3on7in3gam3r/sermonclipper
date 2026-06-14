import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import PodcastFeed from '@/models/PodcastFeed';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const feeds = await PodcastFeed.find({ userId }).lean();
  return NextResponse.json({ feeds });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { feedUrl, title, autoProcess = false } = await req.json();
  if (!feedUrl) return NextResponse.json({ error: 'feedUrl required' }, { status: 400 });

  await connectDB();
  const feed = await PodcastFeed.findOneAndUpdate(
    { userId, feedUrl },
    { $set: { title, autoProcess: Boolean(autoProcess) } },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true, feed });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const feedUrl = req.nextUrl.searchParams.get('feedUrl');
  if (!feedUrl) return NextResponse.json({ error: 'feedUrl required' }, { status: 400 });

  await connectDB();
  await PodcastFeed.deleteOne({ userId, feedUrl });
  return NextResponse.json({ ok: true });
}
