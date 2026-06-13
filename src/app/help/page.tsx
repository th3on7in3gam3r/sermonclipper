import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/home/LandingNav';
import SiteFooter from '@/components/layout/SiteFooter';
import HelpCenter from '@/components/help/HelpCenter';

export const metadata: Metadata = {
  title: 'Help Center — Vesper Studio',
  description:
    'Self-serve documentation for Vesper Studio: uploading sermons, using the Studio, exporting reels, billing, and troubleshooting.',
  alternates: { canonical: '/help' },
};

export default function HelpPage() {
  return (
    <>
      <LandingNav />
      <main className="help-page">
        <div className="help-page-hero">
          <p className="seo-kicker">Help Center</p>
          <h1>How can we help?</h1>
          <p className="seo-lead">
            Guides for uploading sermons, styling clips in Studio, exporting reels, and managing your account.
          </p>
          <Link href="/dashboard" className="help-page-studio-link">
            Back to Studio →
          </Link>
        </div>
        <HelpCenter mode="page" />
      </main>
      <SiteFooter />
    </>
  );
}
