import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import FeatureRequest from '@/models/FeatureRequest';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Sign in to vote' }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const request = await FeatureRequest.findById(id);
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (request.voterIds.includes(userId)) {
    return NextResponse.json({ ok: true, votes: request.votes, alreadyVoted: true });
  }

  request.voterIds.push(userId);
  request.votes = request.voterIds.length;
  await request.save();

  return NextResponse.json({ ok: true, votes: request.votes });
}
