import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LandingNav from '@/components/home/LandingNav';
import SiteFooter from '@/components/layout/SiteFooter';
import { CHURCH_SEGMENTS, parseSegment } from '@/data/churchSegments';

type Props = { params: Promise<{ segment: string }> };

export function generateStaticParams() {
  return Object.keys(CHURCH_SEGMENTS).map((segment) => ({ segment }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segment: raw } = await params;
  const segment = parseSegment(raw);
  if (!segment) return { title: 'For Churches — Vesper' };
  const data = CHURCH_SEGMENTS[segment];
  return {
    title: `${data.title} — Vesper`,
    description: data.headline,
    alternates: { canonical: `/for/${segment}` },
  };
}

export default async function SegmentLandingPage({ params }: Props) {
  const { segment: raw } = await params;
  const segment = parseSegment(raw);
  if (!segment) notFound();
  const data = CHURCH_SEGMENTS[segment];

  return (
    <>
      <LandingNav />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '100px 24px 120px', textAlign: 'center' }}>
        <div className="vesper-badge badge-violet" style={{ marginBottom: '24px' }}>
          FOR {data.title.toUpperCase()}
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: 900, marginBottom: '32px', lineHeight: 1.15 }}>
          {data.headline}
        </h1>

        <ul style={{ textAlign: 'left', maxWidth: '560px', margin: '0 auto 48px', lineHeight: 1.8, color: 'var(--text-muted)' }}>
          {data.painPoints.map((p) => (
            <li key={p} style={{ marginBottom: '12px' }}>
              {p}
            </li>
          ))}
        </ul>

        <div className="glass-card" style={{ padding: '24px', marginBottom: '32px', textAlign: 'left' }}>
          <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--primary)', marginBottom: '8px' }}>RECOMMENDED PLAN</div>
          <p style={{ fontSize: '16px' }}>{data.plan}</p>
        </div>

        <blockquote style={{ fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: '40px' }}>
          &ldquo;{data.testimonial.quote}&rdquo;
          <footer style={{ marginTop: '8px', fontSize: '14px' }}>— {data.testimonial.author}</footer>
        </blockquote>

        <Link href="/sign-up" className="vesper-btn vesper-btn-primary shimmer-effect" style={{ padding: '16px 32px' }}>
          Start free
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
