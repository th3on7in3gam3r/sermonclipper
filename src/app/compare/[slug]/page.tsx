import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LandingNav from '@/components/home/LandingNav';
import SiteFooter from '@/components/layout/SiteFooter';
import { COMPARE_PAGES, getComparePage } from '@/data/comparePages';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return COMPARE_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getComparePage(slug);
  if (!page) return { title: 'Compare — Vesper' };
  return {
    title: `${page.headline} — Vesper`,
    description: page.summary[0],
    alternates: { canonical: `/compare/${slug}` },
  };
}

export default async function ComparePage({ params }: Props) {
  const { slug } = await params;
  const page = getComparePage(slug);
  if (!page) notFound();

  return (
    <>
      <LandingNav />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 24px 120px' }}>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, marginBottom: '32px', lineHeight: 1.2 }}>
          {page.headline}
        </h1>

        {page.summary.map((p) => (
          <p key={p} style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '16px', fontSize: '17px' }}>
            {p}
          </p>
        ))}

        <div className="glass-card" style={{ padding: '24px', margin: '40px 0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Feature</th>
                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Vesper</th>
                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{page.competitor}</th>
              </tr>
            </thead>
            <tbody>
              {page.features.map((f) => (
                <tr key={f.name}>
                  <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{f.name}</td>
                  <td style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {f.vesper ? '✅' : '❌'}
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {f.competitor ? '✅' : '❌'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <blockquote
          className="glass-card"
          style={{ padding: '28px', marginBottom: '40px', borderLeft: '4px solid var(--primary)' }}
        >
          <p style={{ fontSize: '18px', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '12px' }}>
            &ldquo;{page.testimonial.quote}&rdquo;
          </p>
          <footer style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            — {page.testimonial.author}, {page.testimonial.church}
          </footer>
        </blockquote>

        <Link href="/sign-up" className="vesper-btn vesper-btn-primary shimmer-effect" style={{ padding: '16px 32px' }}>
          Try Vesper free — no credit card required
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
