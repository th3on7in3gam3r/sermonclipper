import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import SermonNotes from '@/models/SermonNotes';

type Params = { params: Promise<{ jobId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { jobId } = await params;
  await connectDB();
  const notes = await SermonNotes.findOneAndUpdate(
    { jobId, userId },
    { $set: { published: true } },
    { new: true }
  );
  if (!notes) return NextResponse.json({ error: 'Generate notes first' }, { status: 404 });

  return NextResponse.json({ slug: notes.slug, url: `/notes/${notes.slug}` });
}
