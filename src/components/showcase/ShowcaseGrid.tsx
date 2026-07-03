'use client';

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

export default function ShowcaseGrid() {
  const [clips, setClips] = useState<ShowcaseClip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/showcase')
      .then((r) => r.json())
      .then((d) => setClips(d.clips || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p style={{ color: 'var(--text-muted)' }}>
        Loading showcase clips…
      </p>
    );
  }

  if (!clips.length) {
    return (
      <p style={{ color: 'var(--text-muted)' }}>
        No showcase clips yet. Churches can opt in under Dashboard → Settings.
      </p>
    );
  }

  return (
    <div className="showcase-grid">
      {clips.map((clip) => (
        <article key={clip.clipId} className="showcase-card glass-card premium-border">
          <div className="showcase-card-video-wrap">
            <video src={clip.videoUrl} muted loop playsInline autoPlay preload="auto" />
            <span className="showcase-badge">{clip.featured ? 'Featured example' : 'Made with Vesper'}</span>
          </div>
          <div className="showcase-card-body">
            <p className="showcase-church">{clip.churchName}</p>
            <p className="showcase-caption">{clip.caption}</p>
          </div>
        </article>
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
