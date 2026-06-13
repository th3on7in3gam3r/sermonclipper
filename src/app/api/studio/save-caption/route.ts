import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Sermon from '@/models/Sermon';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { jobId, clipIndex, caption } = await req.json();
  if (!jobId || clipIndex == null || !caption) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  await connectDB();
  const sermon = await Sermon.findOne({ userId, jobId });
  if (!sermon) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const analysis = sermon.analysis as { clips?: Record<string, unknown>[] };
  const clips = analysis?.clips || [];
  const clip = clips[clipIndex] as { suggested_captions?: string[] } | undefined;
  if (clip) {
    clip.suggested_captions = [caption];
    clips[clipIndex] = clip;
    analysis.clips = clips;
    sermon.analysis = analysis;
    sermon.markModified('analysis');
    await sermon.save();
  }

  try {
    const { markChecklist } = await import('@/lib/checklist');
    await markChecklist(userId, 'customizedCaption');
  } catch {
    /* non-blocking */
  }

  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}
