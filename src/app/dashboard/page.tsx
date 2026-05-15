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
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this harvest? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/sermons?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSermons(prev => prev.filter(s => s._id !== id));
      } else {
        alert('Failed to delete sermon');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

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
    <main className="vesper-mesh-bg-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="vesper-mesh-bg" />
      
      {/* Navigation */}
      <header className="glass-card" style={{ 
        position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)', 
        width: 'calc(100% - 32px)', maxWidth: '1400px', height: '72px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '0 32px', zIndex: 1000, borderRadius: '20px'
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/vesper-logo-clean.png" alt="VESPER" style={{ height: '28px', width: 'auto' }} />
          </div>
        </Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {userData && (
            <div className="vesper-badge badge-violet" style={{ padding: '8px 16px', gap: '12px' }}>
              <span style={{ fontWeight: 900 }}>{userData.plan?.replace('_', ' ')}</span>
              <span style={{ opacity: 0.5 }}>|</span>
              <span style={{ opacity: 0.8 }}>{userData.usageCount || 0}/{userData.limit === 999999 ? '∞' : userData.limit}</span>
            </div>
          )}
          <Link href="/" className="vesper-btn-outline" style={{ border: 'none', background: 'transparent', fontSize: '13px', color: 'var(--text-muted)' }}>HOME</Link>
          <UserButton />
        </div>
      </header>

      <div style={{ maxWidth: '1400px', margin: '140px auto 0', padding: '0 40px', position: 'relative', zIndex: 10 }}>
        <div style={{ marginBottom: '64px' }}>
          <div className="vesper-badge badge-violet" style={{ marginBottom: '16px' }}>NEURAL ARCHIVE</div>
          <h1 className="title-xl gradient-text" style={{ fontSize: 'clamp(32px, 6vw, 64px)', marginBottom: '16px' }}>
            YOUR <span className="accent-text">HARVEST</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '18px', maxWidth: '600px' }}>
            Manage your cinematic ministry assets and social media reels across all series.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '24px', animation: 'pulse 2s infinite' }}>◈</div>
            <p style={{ color: 'var(--text-dim)', fontSize: '16px', fontWeight: 900, letterSpacing: '0.2em' }}>SYNCHRONIZING NEURAL ARCHIVES...</p>
          </div>
        ) : sermons.length === 0 ? (
          <div className="glass-card premium-border animate-in" style={{ textAlign: 'center', padding: '100px 40px', borderStyle: 'dashed' }}>
            <div style={{ fontSize: '48px', marginBottom: '24px', opacity: 0.3 }}>🌾</div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '16px' }}>No Sermons Harvested Yet</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '16px' }}>Start your first cinematic harvest to populate your dashboard.</p>
            <Link href="/">
              <button className="vesper-btn vesper-btn-primary shimmer-effect" style={{ padding: '16px 40px' }}>NEW HARVEST SESSION</button>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                  {monthSermons.map((sermon) => (
                    <Link 
                      key={sermon._id} 
                      href={`/results?jobId=${sermon.jobId}&videoUrl=${encodeURIComponent(sermon.videoUrl)}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className="glass-card premium-border animate-in" style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '200px', background: '#000', position: 'relative', overflow: 'hidden' }}>
                          {getYoutubeId(sermon.videoUrl || '') ? (
                            <img 
                              src={`https://img.youtube.com/vi/${getYoutubeId(sermon.videoUrl || '')}/maxresdefault.jpg`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                              alt="Sermon Thumbnail"
                            />
                          ) : (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900, color: 'rgba(255,255,255,0.1)', letterSpacing: '0.4em' }}>VESPER</div>
                          )}
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,1), transparent)' }} />
                          <div className="vesper-badge badge-violet" style={{ position: 'absolute', top: '16px', right: '16px', backdropFilter: 'blur(8px)' }}>
                            {sermon.analysis?.clips?.length || 0} CLIPS
                          </div>
                          <button 
                            onClick={(e) => handleDelete(e, sermon._id)}
                            style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Delete Harvest"
                          >
                            ✕
                          </button>
                        </div>
                        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>{sermon.title}</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5, height: '3em', overflow: 'hidden' }}>
                            {sermon.mainTheme || 'Neural analysis complete.'}
                          </p>
                          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-dim)' }}>
                              {new Date(sermon.createdAt).toLocaleDateString()}
                            </span>
                            <span style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: 900 }}>VIEW ASSETS →</span>
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
      <footer className="glass-card" style={{ padding: '80px 20px', borderRadius: '48px 48px 0 0', borderBottom: 'none', borderLeft: 'none', borderRight: 'none', textAlign: 'center', background: 'rgba(0,0,0,0.5)', marginTop: '100px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'center', gap: '40px', fontSize: '11px', fontWeight: 900, letterSpacing: '0.3em', opacity: 0.6, marginBottom: '24px' }}>
          <Link href="/privacy" style={{ color: '#fff', textDecoration: 'none' }}>PRIVACY POLICY</Link>
          <Link href="/terms" style={{ color: '#fff', textDecoration: 'none' }}>TERMS OF SERVICE</Link>
          <span style={{ color: '#fff' }}>© 2026 VESPER</span>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-dim)', fontWeight: 600 }}>
          Made by <a href="https://biblefunland.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 800 }}>BIBLEFUNLAND</a> STUDIOS
        </p>
      </footer>
    </main>
  );
}
