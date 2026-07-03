'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteFooter from '@/components/layout/SiteFooter';

type ShowcaseClip = {
  clipId: string;
  churchName: string;
  caption: string;
  videoUrl: string;
  featured?: boolean;
};

const FEATURED_FALLBACK: ShowcaseClip[] = [
  {
    clipId: 'featured-vesper-demo',
    churchName: 'Vesper Studio',
    caption: 'Are You Living Your True Calling?',
    videoUrl: '',
    featured: true,
  },
];

function ShowcaseCard({ clip, fallbackUrl }: { clip: ShowcaseClip; fallbackUrl: string }) {
  const [src, setSrc] = useState(clip.videoUrl || fallbackUrl);

  useEffect(() => {
    setSrc(clip.videoUrl || fallbackUrl);
  }, [clip.videoUrl, fallbackUrl]);

  return (
    <article className="showcase-card glass-card premium-border">
      <div className="showcase-card-video-wrap">
        <video
          src={src}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          onError={() => {
            if (fallbackUrl && src !== fallbackUrl) setSrc(fallbackUrl);
          }}
        />
        <span className="showcase-badge">{clip.featured ? 'Featured example' : 'Made with Vesper'}</span>
      </div>
      <div className="showcase-card-body">
        <p className="showcase-church">{clip.churchName}</p>
        <p className="showcase-caption">{clip.caption}</p>
      </div>
    </article>
  );
}

export default function ShowcaseGrid() {
  const [clips, setClips] = useState<ShowcaseClip[]>(FEATURED_FALLBACK);
  const [fallbackUrl, setFallbackUrl] = useState('');

  useEffect(() => {
    fetch('/api/demo-video?panel=after')
      .then((r) => r.json())
      .then((d) => {
        const url = d.url || d.fallbackUrl;
        if (url) setFallbackUrl(url);
      })
      .catch(() => {});

    fetch('/api/showcase')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.clips) && d.clips.length) setClips(d.clips);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="showcase-grid">
      {clips.map((clip) => (
        <ShowcaseCard key={clip.clipId} clip={clip} fallbackUrl={fallbackUrl} />
      ))}
    </div>
  );
}

export function ShowcasePageShell() {
  return (
    <main className="vesper-mesh-bg-container" style={{ minHeight: '100vh' }}>
      <div className="vesper-mesh-bg" />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '120px 24px 80px', position: 'relative', zIndex: 1 }}>
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
          ← Home
        </Link>
        <h1 className="title-xl" style={{ margin: '16px 0 8px' }}>
          See what churches are <span className="accent-text">creating</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 40 }}>
          Example reels from Vesper, plus clips from churches who opt in under Dashboard → Settings → Bio Page &
          Showcase.
        </p>
        <ShowcaseGrid />
      </div>
      <SiteFooter />
    </main>
  );
}
