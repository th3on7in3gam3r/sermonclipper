'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteFooter from '@/components/layout/SiteFooter';

type BioData = {
  churchName: string;
  description: string;
  logoUrl?: string;
  social: { instagram?: string; tiktok?: string; youtube?: string };
  background: string;
  recentClips: { clipId: string; caption: string; videoUrl: string }[];
  showPoweredBy: boolean;
};

export default function BioPageClient({ username }: { username: string }) {
  const [bio, setBio] = useState<BioData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/bio/${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setBio(d);
      })
      .catch(() => setError('Could not load bio page'));
  }, [username]);

  if (error) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0d0d14', color: '#fff' }}>
        <p>{error}</p>
        <Link href="/" style={{ color: '#a78bfa' }}>
          ← Vesper
        </Link>
      </main>
    );
  }

  if (!bio) {
    return <main style={{ minHeight: '100vh', background: '#0d0d14' }} />;
  }

  return (
    <main className="bio-page" style={{ background: bio.background, minHeight: '100vh' }}>
      <div className="bio-page-inner">
        {bio.logoUrl && <img src={bio.logoUrl} alt="" className="bio-page-logo" />}
        <h1>{bio.churchName}</h1>
        {bio.description && <p className="bio-page-desc">{bio.description}</p>}

        <div className="bio-page-social">
          {bio.social.instagram && (
            <a href={bio.social.instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          )}
          {bio.social.tiktok && (
            <a href={bio.social.tiktok} target="_blank" rel="noopener noreferrer">
              TikTok
            </a>
          )}
          {bio.social.youtube && (
            <a href={bio.social.youtube} target="_blank" rel="noopener noreferrer">
              YouTube
            </a>
          )}
        </div>

        {bio.recentClips.length > 0 && (
          <div className="bio-page-clips">
            {bio.recentClips.map((clip) => (
              <div key={clip.clipId} className="bio-page-clip">
                <video src={clip.videoUrl} controls playsInline preload="metadata" />
                <p>{clip.caption}</p>
              </div>
            ))}
          </div>
        )}

        <a href={bio.social.instagram || bio.social.youtube || '#'} className="vesper-btn vesper-btn-primary bio-page-cta">
          Follow Us
        </a>
      </div>

      {bio.showPoweredBy && (
        <footer className="bio-page-footer">
          <Link href="/">Create your own with Vesper</Link>
        </footer>
      )}
      <SiteFooter />
    </main>
  );
}
