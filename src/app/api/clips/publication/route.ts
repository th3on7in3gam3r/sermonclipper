import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import ClipPublication from '@/models/ClipPublication';
import type { AnalyticsPlatform } from '@/models/ClipMetric';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clipId, platform, externalId, postUrl } = await req.json();
  if (!clipId || !platform || !externalId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  await connectDB();
  await ClipPublication.findOneAndUpdate(
    { userId, clipId, platform: platform as AnalyticsPlatform },
    {
      $set: {
        externalId,
        postUrl,
        publishedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}
