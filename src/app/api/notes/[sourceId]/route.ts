import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SermonNotes from '@/models/SermonNotes';

type Params = { params: Promise<{ sourceId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { sourceId } = await params;
  await connectDB();
  const notes = await SermonNotes.findOne({ slug: sourceId, published: true }).lean();
  if (!notes) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    title: notes.title,
    scriptureReferences: notes.scriptureReferences,
    keyPoints: notes.keyPoints,
    quotes: notes.quotes,
    reflectionQuestions: notes.reflectionQuestions,
    transcript: notes.transcript,
    updatedAt: notes.updatedAt,
  });
}
