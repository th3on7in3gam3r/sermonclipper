import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import NpsResponse from '@/models/NpsResponse';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { score, feedback } = await req.json();
  if (typeof score !== 'number' || score < 0 || score > 10) {
    return NextResponse.json({ error: 'Score must be 0–10' }, { status: 400 });
  }

  await connectDB();
  const existing = await NpsResponse.findOne({ userId });
  if (existing) {
    return NextResponse.json({ error: 'Survey already submitted' }, { status: 409 });
  }

  await NpsResponse.create({ userId, score, feedback: feedback || '' });
  return NextResponse.json({ success: true });
}
