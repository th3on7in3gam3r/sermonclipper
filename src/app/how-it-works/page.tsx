import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/home/LandingNav';
import SiteFooter from '@/components/layout/SiteFooter';

export const metadata: Metadata = {
  title: 'How Vesper Works — Sermon to Reel in 4 Steps',
  description:
    'See how Vesper turns full sermon videos into captioned 9:16 reels for Instagram, TikTok, and YouTube Shorts in minutes.',
  alternates: { canonical: '/how-it-works' },
};

const STEPS = [
  {
    title: '1. Upload or paste a link',
    body: 'Upload an MP4 directly (up to 500MB) or paste a YouTube sermon link for AI analysis.',
  },
  {
    title: '2. AI finds the moments',
    body: 'GPT-4o scans your sermon and surfaces the most shareable clips with hooks, captions, and timestamps.',
  },
  {
    title: '3. Style in Vesper Studio',
    body: 'Pick caption templates, fonts, filters, and animations — preview everything on a live phone frame.',
  },
  {
    title: '4. Export your reel',
    body: 'Cloud rendering bakes captions into a downloadable 9:16 MP4 ready for Reels, Shorts, and TikTok.',
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <LandingNav />
      <main className="seo-page">
        <section className="seo-hero">
          <p className="seo-kicker">How it works</p>
          <h1>From pulpit to Reels in four steps</h1>
          <p className="seo-lead">
            Vesper is built for church media teams who need consistent short-form without spending hours in an editor.
          </p>
        </section>
        <section className="seo-steps">
          {STEPS.map((step) => (
            <article key={step.title} className="seo-step-card glass-card">
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </article>
          ))}
        </section>
        <section className="seo-cta">
          <h2>Start for free — no credit card required</h2>
          <Link href="/#upload" className="vesper-btn vesper-btn-primary shimmer-effect">
            Try Vesper free
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
