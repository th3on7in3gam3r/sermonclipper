'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LandingNav from '@/components/home/LandingNav';
import SiteFooter from '@/components/layout/SiteFooter';

type ShowcaseClip = {
  clipId: string;
  churchName: string;
  caption: string;
  videoUrl: string;
  featured?: boolean;
};

function ShowcaseVideo({
  src,
  className,
  autoPlay = true,
}: {
  src: string;
  className?: string;
  autoPlay?: boolean;
}) {
  return (
    <video
      className={className}
      src={src}
      muted
      loop
      playsInline
      autoPlay={autoPlay}
      preload="auto"
    />
  );
}

function ShowcaseCard({ clip }: { clip: ShowcaseClip }) {
  return (
    <article className="showcase-card glass-card premium-border">
      <div className="showcase-card-video-wrap">
        <ShowcaseVideo src={clip.videoUrl} />
        <span className="showcase-badge">{clip.featured ? 'Featured' : 'Made with Vesper'}</span>
      </div>
      <div className="showcase-card-body">
        <p className="showcase-church">{clip.churchName}</p>
        <p className="showcase-caption">{clip.caption}</p>
      </div>
    </article>
  );
}

function ShowcaseSkeleton() {
  return (
    <div className="showcase-loading">
      <div className="showcase-spotlight showcase-spotlight--skeleton glass-card premium-border" aria-hidden />
      <div className="showcase-grid">
        {[0, 1, 2].map((i) => (
          <div key={i} className="showcase-card showcase-card--skeleton glass-card" aria-hidden />
        ))}
      </div>
    </div>
  );
}

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

  if (loading) return <ShowcaseSkeleton />;

  const featured = clips.find((c) => c.featured) ?? clips[0];
  const community = clips.filter((c) => c.clipId !== featured?.clipId);

  if (!featured) {
    return (
      <div className="showcase-empty glass-card premium-border">
        <p className="showcase-empty-title">Showcase clips are on the way</p>
        <p className="showcase-empty-copy">
          Churches can opt in under Dashboard → Settings → Bio Page &amp; Showcase.
        </p>
        <Link href="/dashboard/settings" className="vesper-btn vesper-btn-primary">
          Go to Settings
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="showcase-spotlight glass-card premium-border">
        <div className="showcase-spotlight-media">
          <div className="showcase-spotlight-phone">
            <ShowcaseVideo src={featured.videoUrl} className="showcase-spotlight-video" />
            <span className="showcase-spotlight-badge">Featured reel</span>
          </div>
        </div>
        <div className="showcase-spotlight-copy">
          <p className="showcase-spotlight-church">{featured.churchName}</p>
          <h2 className="showcase-spotlight-title">{featured.caption}</h2>
          <p className="showcase-spotlight-desc">
            A vertical sermon highlight exported with Vesper — captions, branding, and 9:16 framing included.
          </p>
          <ul className="showcase-spotlight-stats">
            <li>
              <strong>9:16</strong>
              <span>Reels &amp; Shorts</span>
            </li>
            <li>
              <strong>Auto</strong>
              <span>Captions &amp; hooks</span>
            </li>
            <li>
              <strong>MP4</strong>
              <span>Ready to post</span>
            </li>
          </ul>
        </div>
      </section>

      {community.length > 0 && (
        <section className="showcase-gallery-section">
          <div className="showcase-gallery-header">
            <h2 className="showcase-gallery-title">From the community</h2>
            <p className="showcase-gallery-sub">
              Churches who opt in share exported reels here — inspiration for your media team.
            </p>
          </div>
          <div className="showcase-grid">
            {community.map((clip) => (
              <ShowcaseCard key={clip.clipId} clip={clip} />
            ))}
          </div>
        </section>
      )}

      <section className="showcase-cta-band glass-card premium-border">
        <div>
          <p className="showcase-cta-eyebrow">Get featured</p>
          <h2 className="showcase-cta-title">Share your church&apos;s reels on this page</h2>
          <p className="showcase-cta-copy">
            Opt in once under Dashboard → Settings. Your exported clips can appear alongside other ministries.
            Turn it off anytime.
          </p>
        </div>
        <div className="showcase-cta-actions">
          <Link href="/dashboard/settings" className="vesper-btn vesper-btn-primary shimmer-effect">
            Opt in in Settings
          </Link>
          <Link href="/#upload" className="vesper-btn vesper-btn-outline">
            Create your first reel
          </Link>
        </div>
      </section>
    </>
  );
}

export function ShowcasePageShell() {
  return (
    <>
      <LandingNav />
      <main className="vesper-mesh-bg-container showcase-page-wrap">
        <div className="vesper-mesh-bg" />
        <div className="showcase-page">
          <section className="showcase-hero">
            <p className="showcase-hero-kicker">Community Showcase</p>
            <h1 className="showcase-hero-title">
              Real sermon reels from <span className="accent-text">real churches</span>
            </h1>
            <p className="showcase-hero-lead">
              Browse cinematic vertical highlights made with Vesper. See what a finished reel looks like before
              you upload your first sermon.
            </p>
          </section>

          <ShowcaseGrid />
        </div>
        <SiteFooter />
      </main>
    </>
  );
}
