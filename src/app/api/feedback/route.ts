import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import FeatureRequest from '@/models/FeatureRequest';

export async function GET(req: NextRequest) {
  await connectDB();
  const status = req.nextUrl.searchParams.get('status');
  const category = req.nextUrl.searchParams.get('category');

  const filter: Record<string, string> = {};
  if (status) filter.status = status;
  if (category) filter.category = category;

  const requests = await FeatureRequest.find(filter).sort({ votes: -1, createdAt: -1 }).limit(100).lean();

  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const { title, description, category } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  await connectDB();
  const doc = await FeatureRequest.create({
    title: title.trim(),
    description: description?.trim(),
    category: category || 'Other',
    votes: 1,
    voterIds: userId ? [userId] : [],
  });

  return NextResponse.json({ ok: true, id: doc._id });
}
