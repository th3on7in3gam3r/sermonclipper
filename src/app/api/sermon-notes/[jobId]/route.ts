import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Sermon from '@/models/Sermon';
import SermonNotes from '@/models/SermonNotes';
import { generateSermonNotesContent } from '@/lib/sermonNotes/generateNotes';
import { randomBytes } from 'crypto';

type Params = { params: Promise<{ jobId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { jobId } = await params;
  await connectDB();
  const notes = await SermonNotes.findOne({ jobId, userId }).lean();
  return NextResponse.json({ notes: notes || null });
}

export async function POST(_req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { jobId } = await params;
  await connectDB();
  const sermon = await Sermon.findOne({ jobId, userId }).lean();
  if (!sermon?.analysis) return NextResponse.json({ error: 'Sermon not found' }, { status: 404 });

  const content = generateSermonNotesContent(sermon.analysis as Record<string, unknown>);
  const slug = randomBytes(6).toString('hex');

  const notes = await SermonNotes.findOneAndUpdate(
    { jobId },
    {
      $set: {
        userId,
        slug,
        title: content.title,
        scriptureReferences: content.scriptureReferences,
        keyPoints: content.keyPoints,
        quotes: content.quotes,
        reflectionQuestions: content.reflectionQuestions,
        transcript: content.transcript,
      },
    },
    { upsert: true, new: true }
  );

  return NextResponse.json({ notes });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { jobId } = await params;
  const body = await req.json();
  await connectDB();

  const notes = await SermonNotes.findOneAndUpdate(
    { jobId, userId },
    {
      $set: {
        title: body.title,
        scriptureReferences: body.scriptureReferences,
        keyPoints: body.keyPoints,
        quotes: body.quotes,
        reflectionQuestions: body.reflectionQuestions,
        transcript: body.transcript,
      },
    },
    { new: true }
  );

  if (!notes) return NextResponse.json({ error: 'Notes not found' }, { status: 404 });
  return NextResponse.json({ notes });
}
