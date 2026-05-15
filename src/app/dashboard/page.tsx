'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { isLoaded, userId } = useAuth();
  const [sermons, setSermons] = useState<{ _id: string; jobId: string; title: string; mainTheme?: string; videoUrl: string; createdAt: string; analysis?: { clips?: unknown[] } }[]>([]);
  const [userData, setUserData] = useState<{ plan?: string; usageCount?: number; limit?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getYoutubeId = (url: string) => {
    try {
      if (url.includes('youtube.com')) return new URL(url).searchParams.get('v');
      if (url.includes('youtu.be')) return url.split('/').pop()?.split('?')[0];
    } catch { return null; }
    return null;
  };

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/');
    }
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (userId) {
      Promise.all([
        fetch('/api/sermons').then(res => res.json()),
        fetch('/api/user/status').then(res => res.json())
      ]).then(([sermonsData, statusData]) => {
        if (Array.isArray(sermonsData)) setSermons(sermonsData);
        setUserData(statusData);
        setLoading(false);
      }).catch(err => {
        console.error('Failed to fetch dashboard data:', err);
        setLoading(false);
      });
    }
  }, [userId]);

  const statusBar = userData ? (
    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(139, 92, 246, 0.1)', padding: '6px 16px', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)', gap: '10px' }}>
      <span style={{ fontSize: '14px', fontWeight: 900, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {userData.plan?.replace('_', ' ') || 'PLAN'}
      </span>
      <span style={{ fontSize: '14px', color: '#A1A1AA', fontWeight: 800 }}>
        {`${userData.usageCount || 0} / ${userData.limit === 999999 ? '∞' : userData.limit}`}
      </span>
    </div>
  ) : null;

  return (
    <main style={{ minHeight: '100vh', padding: '60px 20px', position: 'relative', background: '#0A0A0F' }}>
      <div className="vesper-bg" />
      
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 60px', zIndex: 1000 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '0.4em', color: '#fff', opacity: 0.8 }}>
            VESPER
          </div>
        </Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {statusBar}
          <Link href="/" style={{ textDecoration: 'none', fontSize: '15px', fontWeight: 800, color: '#A1A1AA', letterSpacing: '0.1em' }}>HOME</Link>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <UserButton />
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '80px auto 0', position: 'relative', zIndex: 10 }}>
        <div style={{ marginBottom: '64px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.04em', marginBottom: '8px' }}>
            YOUR <span style={{ color: '#8B5CF6' }}>HARVEST</span>
          </h1>
          <p style={{ color: '#A1A1AA', fontSize: '18px' }}>
            Manage your cinematic ministry assets and social media reels.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div className="spiritual-rays" style={{ position: 'static', margin: '0 auto 24px' }} />
            <p style={{ color: '#666', fontSize: '16px', letterSpacing: '0.2em' }}>SYNCHRONIZING NEURAL ARCHIVES...</p>
          </div>
        ) : sermons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 40px', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>No Sermons Harvested Yet</h2>
            <p style={{ color: '#A1A1AA', marginBottom: '32px' }}>Start your first cinematic harvest to populate your dashboard.</p>
            <Link href="/">
              <button className="shimmer-btn" style={{ padding: '16px 40px', borderRadius: '14px' }}>New Harvest Session</button>
            </Link>
          </div>
        ) : (
          <div>
            {Object.entries(
              sermons.reduce((acc, sermon) => {
                const month = new Date(sermon.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
                if (!acc[month]) acc[month] = [];
                acc[month].push(sermon);
                return acc;
              }, {} as Record<string, typeof sermons>)
            ).map(([month, monthSermons]) => (
              <div key={month} style={{ marginBottom: '64px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#A1A1AA', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                  {month} Series
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '32px' }}>
                  {monthSermons.map((sermon) => (
                    <Link 
                      key={sermon._id} 
                      href={`/results?jobId=${sermon.jobId}&videoUrl=${encodeURIComponent(sermon.videoUrl)}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className="clip-card animate-up" style={{ height: '100%', transition: 'transform 0.3s ease' }}>
                        <div className="clip-preview" style={{ height: '200px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                          {getYoutubeId(sermon.videoUrl || '') ? (
                            <img 
                              src={`https://img.youtube.com/vi/${getYoutubeId(sermon.videoUrl || '')}/maxresdefault.jpg`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                              alt="Sermon Thumbnail"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div style={{ fontSize: '40px', opacity: 0.2, fontWeight: 900 }}>VESPER</div>
                          )}
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #111114, transparent)' }} />
                          <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: '99px', fontSize: '14px', color: '#8B5CF6', fontWeight: 800 }}>
                            {sermon.analysis?.clips?.length || 0} CLIPS
                          </div>
                        </div>
                        <div className="clip-info" style={{ padding: '24px' }}>
                          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', lineBreak: 'anywhere' }}>{sermon.title}</h3>
                          <p style={{ color: '#A1A1AA', fontSize: '17px', lineHeight: 1.5, height: '4.5em', overflow: 'hidden' }}>
                            {sermon.mainTheme || 'Neural analysis complete.'}
                          </p>
                          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: 900, color: '#666' }}>
                              {new Date(sermon.createdAt).toLocaleDateString()}
                            </span>
                            <span style={{ color: '#8B5CF6', fontSize: '16px', fontWeight: 700 }}>VIEW ASSETS →</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 10, padding: '80px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '100px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'center', gap: '40px', fontSize: '15px', fontWeight: 700, letterSpacing: '0.2em', opacity: 0.4, marginBottom: '16px' }}>
          <Link href="/privacy" style={{ color: '#fff', textDecoration: 'none' }}>PRIVACY POLICY</Link>
          <Link href="/terms" style={{ color: '#fff', textDecoration: 'none' }}>TERMS OF SERVICE</Link>
          <span style={{ color: '#fff' }}>© 2026 VESPER</span>
        </div>
        <p style={{ fontSize: '15px', color: '#52525B', fontWeight: 600 }}>
          Made by <a href="https://biblefunland.com" target="_blank" rel="noreferrer" style={{ color: '#8B5CF6', textDecoration: 'none', fontWeight: 800 }}>BIBLEFUNLAND</a> STUDIOS
        </p>
      </footer>
    </main>
  );
}
