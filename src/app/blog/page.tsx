import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/home/LandingNav';
import SiteFooter from '@/components/layout/SiteFooter';

export const metadata: Metadata = {
  title: 'Resources — Church Video & Social Media Tips',
  description: 'Guides for church media teams on sermon clips, Reels strategy, and short-form outreach.',
  alternates: { canonical: '/blog' },
};

const ARTICLES = [
  {
    slug: 'sermon-to-reel',
    title: 'How to Turn a 45-Minute Sermon Into a 60-Second Reel',
    excerpt: 'A practical workflow for finding one hook, one quote, and one call-to-action from any message.',
  },
  {
    slug: 'best-times-instagram',
    title: 'The 5 Best Times to Post Church Content on Instagram in 2025',
    excerpt: 'When your congregation is actually scrolling — and how to batch content without burning out volunteers.',
  },
  {
    slug: 'short-form-outreach',
    title: 'Why Short-Form Video is the Future of Church Outreach',
    excerpt: 'Reach people who will never sit through a 45-minute livestream — without dumbing down the Gospel.',
  },
];

export default function BlogIndexPage() {
  return (
    <>
      <LandingNav />
      <main className="seo-page">
        <section className="seo-hero">
          <p className="seo-kicker">Resources</p>
          <h1>Guides for church media teams</h1>
        </section>
        <section className="seo-articles">
          {ARTICLES.map((a) => (
            <Link key={a.slug} href={`/blog/${a.slug}`} className="seo-article-card glass-card">
              <h2>{a.title}</h2>
              <p>{a.excerpt}</p>
              <span className="seo-read-more">Read article →</span>
            </Link>
          ))}
        </section>
        <section className="seo-cta">
          <Link href="/#upload" className="vesper-btn vesper-btn-primary shimmer-effect">
            Start for free — no credit card required
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
