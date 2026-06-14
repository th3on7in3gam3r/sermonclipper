import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import ClipExport from '@/models/ClipExport';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clipId, renderUrl, thumbnailUrl } = await req.json();
  if (!clipId || !renderUrl) {
    return NextResponse.json({ error: 'Missing clipId or renderUrl' }, { status: 400 });
  }

  await connectDB();
  await ClipExport.findOneAndUpdate(
    { userId, clipId },
    {
      $set: {
        renderUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}
