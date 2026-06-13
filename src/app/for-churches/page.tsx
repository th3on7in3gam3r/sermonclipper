import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/home/LandingNav';
import SiteFooter from '@/components/layout/SiteFooter';
import { SUPPORT_EMAIL } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Vesper for Churches — Media Teams & Outreach',
  description:
    'Vesper helps church media teams turn Sunday sermons into consistent Instagram Reels, TikTok clips, and YouTube Shorts.',
  alternates: { canonical: '/for-churches' },
};

export default function ForChurchesPage() {
  return (
    <>
      <LandingNav />
      <main className="seo-page">
        <section className="seo-hero">
          <p className="seo-kicker">For churches</p>
          <h1>Your media team&apos;s sermon-to-social pipeline</h1>
          <p className="seo-lead">
            Stop rebuilding the same edit every Monday. Vesper finds highlight moments, writes captions, and exports
            branded vertical reels your volunteers can post all week.
          </p>
        </section>
        <section className="seo-grid">
          <article className="seo-step-card glass-card">
            <h2>One sermon, many touchpoints</h2>
            <p>Turn a single message into a week of Reels, quote graphics, and Shorts without rewatching hour-long footage.</p>
          </article>
          <article className="seo-step-card glass-card">
            <h2>Volunteer-friendly</h2>
            <p>Non-editors can customize templates, preview on a phone frame, and download MP4s in minutes.</p>
          </article>
          <article className="seo-step-card glass-card">
            <h2>Built for ministry budgets</h2>
            <p>Start free, upgrade when your church is ready. Church Pro supports teams and unlimited exports.</p>
          </article>
        </section>
        <section className="seo-cta">
          <h2>Book a walkthrough with our team</h2>
          <p>Email {SUPPORT_EMAIL} to schedule a 15-minute demo for your media ministry.</p>
          <Link href="/#upload" className="vesper-btn vesper-btn-primary shimmer-effect">
            Start for free
          </Link>
          <Link href="/#pricing" className="seo-cta-secondary">
            Compare plans →
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
