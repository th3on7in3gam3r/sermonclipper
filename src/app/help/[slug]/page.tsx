import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LandingNav from '@/components/home/LandingNav';
import SiteFooter from '@/components/layout/SiteFooter';
import HelpArticleBody from '@/components/help/HelpArticleBody';
import HelpFeedback from '@/components/help/HelpFeedback';
import { HELP_ARTICLES, getArticleBySlug } from '@/data/helpArticles';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return HELP_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: 'Help — Vesper Studio' };
  return {
    title: `${article.title} — Vesper Help`,
    description: article.paragraphs[0],
    alternates: { canonical: `/help/${slug}` },
  };
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <>
      <LandingNav />
      <main className="help-page help-page--article">
        <Link href="/help" className="help-back-btn">
          ← Help Center
        </Link>
        <HelpArticleBody article={article} />
        <HelpFeedback slug={article.slug} />
      </main>
      <SiteFooter />
    </>
  );
}
