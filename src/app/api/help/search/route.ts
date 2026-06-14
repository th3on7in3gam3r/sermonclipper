import { NextRequest, NextResponse } from 'next/server';
import { searchHelpArticles } from '@/data/helpArticles';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  const articles = searchHelpArticles(q).slice(0, 5).map((a) => ({
    title: a.title,
    slug: a.slug,
    href: `/help/${a.slug}`,
    excerpt: a.paragraphs[0]?.slice(0, 160),
  }));
  return NextResponse.json({ articles });
}
