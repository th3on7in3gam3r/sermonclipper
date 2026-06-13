import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import HelpFeedback from '@/models/HelpFeedback';
import { getArticleBySlug } from '@/data/helpArticles';

export async function POST(req: NextRequest) {
  const { slug, helpful } = await req.json();
  if (!slug || typeof helpful !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  if (!getArticleBySlug(slug)) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  const { userId } = await auth();
  await connectDB();
  await HelpFeedback.create({ slug, helpful, userId: userId || undefined });

  return NextResponse.json({ ok: true });
}
