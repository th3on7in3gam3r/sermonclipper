import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LandingNav from '@/components/home/LandingNav';
import SiteFooter from '@/components/layout/SiteFooter';

const ARTICLES: Record<string, { title: string; description: string; body: string[] }> = {
  'sermon-to-reel': {
    title: 'How to Turn a 45-Minute Sermon Into a 60-Second Reel',
    description: 'Find one hook, one quote, and one CTA from any sermon message.',
    body: [
      'Start with the conclusion — the moment the pastor lands the application. That is usually your hook.',
      'Pull one sentence that stands alone without church jargon. Vesper surfaces these automatically.',
      'Keep the reel under 60 seconds. Open on the strongest line, not the welcome.',
      'End with a single next step: watch the full message, visit this Sunday, or share with a friend.',
    ],
  },
  'best-times-instagram': {
    title: 'The 5 Best Times to Post Church Content on Instagram in 2025',
    description: 'When your congregation is scrolling and how to batch without burnout.',
    body: [
      'Tuesday and Wednesday evenings often outperform Sunday morning for Reels — people reflect mid-week.',
      'Post within 24 hours of the live service while the message is fresh.',
      'Batch exports on Monday using Vesper, then schedule through Meta Business Suite.',
      'Test Stories on Saturday as a teaser for Sunday’s message.',
      'Track saves and shares, not just likes — they predict reach better for ministry content.',
    ],
  },
  'short-form-outreach': {
    title: 'Why Short-Form Video is the Future of Church Outreach',
    description: 'Reach people who will never watch a full livestream.',
    body: [
      'Most seekers discover churches on phones, in 30-second windows between everything else.',
      'Short-form is not shallow — it is an invitation into depth. The full sermon still lives on YouTube.',
      'Consistency beats perfection. One reel per week builds more trust than one polished video per quarter.',
      'Equip members to share clips — personal shares outperform official page posts in many congregations.',
    ],
  },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return Object.keys(ARTICLES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES[slug];
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/blog/${slug}` },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = ARTICLES[slug];
  if (!article) notFound();

  return (
    <>
      <LandingNav />
      <main className="seo-page seo-article">
        <Link href="/blog" className="seo-back">
          ← All resources
        </Link>
        <h1>{article.title}</h1>
        {article.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <section className="seo-cta">
          <Link href="/#upload" className="vesper-btn vesper-btn-primary shimmer-effect">
            Start for free — no credit card required
          </Link>
          <Link href="/#pricing" className="seo-cta-secondary">
            View pricing →
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
