'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import DashboardAccountPanel from '@/components/dashboard/DashboardAccountPanel';
import DashboardSignInGate from '@/components/dashboard/DashboardSignInGate';
import EmptyState from '@/components/shared/EmptyState';
import QuotaDisplay from '@/components/dashboard/QuotaDisplay';
import SiteFooter from '@/components/layout/SiteFooter';
import { vesperClerkAppearance } from '@/lib/clerkAppearance';

type SermonRecord = {
  _id: string;
  jobId: string;
  title: string;
  mainTheme?: string;
  videoUrl: string;
  finalPath?: string;
  createdAt: string;
  analysis?: { clips?: unknown[] };
};

function buildResultsHref(sermon: SermonRecord) {
  const params = new URLSearchParams({
    jobId: sermon.jobId,
    videoUrl: sermon.videoUrl,
  });
  if (sermon.finalPath) {
    params.set('finalPath', sermon.finalPath);
  }
  return `/results?${params.toString()}`;
}

export default function Dashboard() {
  const { isLoaded, userId } = useAuth();
  const [sermons, setSermons] = useState<SermonRecord[]>([]);
  const [userData, setUserData] = useState<{
    plan?: string;
    usageCount?: number;
    limit?: number;
    lastUsageReset?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(1280);

  const getYoutubeId = (url: string) => {
    try {
      if (url.includes('youtube.com')) return new URL(url).searchParams.get('v');
      if (url.includes('youtu.be')) return url.split('/').pop()?.split('?')[0];
    } catch {
      return null;
    }
    return null;
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([fetch('/api/sermons').then((res) => res.json()), fetch('/api/user/status').then((res) => res.json())])
      .then(([sermonsData, statusData]) => {
        if (Array.isArray(sermonsData)) setSermons(sermonsData);
        setUserData(statusData);
      })
      .catch((err) => {
        console.error('Failed to fetch dashboard data:', err);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = viewportWidth < 1024;
  const isPhone = viewportWidth < 640;

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this harvest? This action cannot be undone.')) return;

    try {
      const res = await fetch(`/api/sermons?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSermons((prev) => prev.filter((s) => s._id !== id));
      } else {
        alert('Failed to delete sermon');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (isLoaded && !userId) {
    return <DashboardSignInGate />;
  }

  return (
    <main className="vesper-mesh-bg-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="vesper-mesh-bg" />

      <header
        className="glass-card"
        style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: isPhone ? 'calc(100% - 16px)' : 'calc(100% - 32px)',
          maxWidth: '1400px',
          minHeight: isPhone ? '60px' : '72px',
          height: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isPhone ? '8px 10px' : isMobile ? '0 16px' : '0 32px',
          zIndex: 1000,
          borderRadius: '20px',
          gap: '8px',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: isPhone ? '8px' : '12px', minWidth: 0 }}>
          <img src="/vesper-logo-icon.png" alt="Vesper Studio logo" style={{ height: isPhone ? '26px' : '32px', width: 'auto', flexShrink: 0 }} />
          {!isPhone && (
            <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '0.15em', color: '#fff' }}>
              <span style={{ color: '#8B5CF6' }}>VES</span>PER
            </div>
          )}
        </Link>
        <div style={{ display: 'flex', gap: isPhone ? '6px' : isMobile ? '10px' : '20px', alignItems: 'center', flexShrink: 0 }}>
          {!isPhone && userData && (
            <QuotaDisplay
              compact
              usageCount={userData.usageCount}
              limit={userData.limit}
              lastUsageReset={userData.lastUsageReset}
            />
          )}
          <Link
            href="/"
            className="vesper-btn-outline"
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              color: 'var(--text-muted)',
              padding: isPhone ? '6px 8px' : isMobile ? '8px 10px' : undefined,
            }}
          >
            HOME
          </Link>
          <UserButton
            userProfileMode="modal"
            appearance={vesperClerkAppearance}
            userProfileProps={{ appearance: vesperClerkAppearance }}
          />
        </div>
      </header>

      <div style={{ maxWidth: '1400px', margin: isPhone ? '96px auto 0' : '140px auto 0', padding: isMobile ? '0 12px' : '0 40px', position: 'relative', zIndex: 10, width: '100%' }}>
        <div style={{ marginBottom: isPhone ? '20px' : '32px' }}>
          <div className="vesper-badge badge-violet" style={{ marginBottom: '16px' }}>
            NEURAL ARCHIVE
          </div>
          <h1 className="title-xl gradient-text" style={{ fontSize: isPhone ? '40px' : 'clamp(32px, 6vw, 64px)', marginBottom: '12px' }}>
            YOUR <span className="accent-text">HARVEST</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: isPhone ? '15px' : '18px', maxWidth: '600px' }}>
            Manage your cinematic ministry assets and social media reels across all series.
          </p>
        </div>

        <DashboardAccountPanel userData={userData} isMobile={isPhone} />

        {isPhone && userData && (
          <div style={{ marginBottom: '24px' }}>
            <QuotaDisplay
              usageCount={userData.usageCount}
              limit={userData.limit}
              lastUsageReset={userData.lastUsageReset}
            />
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '24px', animation: 'pulse 2s infinite' }}>◈</div>
            <p style={{ color: 'var(--text-dim)', fontSize: '16px', fontWeight: 900, letterSpacing: '0.2em' }}>
              SYNCHRONIZING NEURAL ARCHIVES...
            </p>
          </div>
        ) : sermons.length === 0 ? (
          <EmptyState
            icon="🎬"
            headline="No clips yet"
            subtext="Upload a sermon or paste a YouTube link to generate your first cinematic reel."
            ctaLabel="Create Your First Clip"
            ctaHref="/#upload"
          />
        ) : (
          <div>
            {Object.entries(
              sermons.reduce(
                (acc, sermon) => {
                  const month = new Date(sermon.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
                  if (!acc[month]) acc[month] = [];
                  acc[month].push(sermon);
                  return acc;
                },
                {} as Record<string, SermonRecord[]>
              )
            ).map(([month, monthSermons]) => (
              <div key={month} style={{ marginBottom: '64px' }}>
                <h2
                  style={{
                    fontSize: isPhone ? '14px' : '18px',
                    fontWeight: 900,
                    color: '#A1A1AA',
                    letterSpacing: isPhone ? '0.1em' : '0.2em',
                    textTransform: 'uppercase',
                    marginBottom: '24px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    paddingBottom: '12px',
                  }}
                >
                  {month} Series
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: isPhone ? '16px' : '24px', maxWidth: '800px', margin: '0 auto' }}>
                  {monthSermons.map((sermon) => (
                    <Link
                      key={sermon._id}
                      href={buildResultsHref(sermon)}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className="glass-card premium-border animate-in" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: isPhone ? '156px' : '200px', background: '#000', position: 'relative', overflow: 'hidden' }}>
                          {getYoutubeId(sermon.videoUrl || '') ? (
                            <img
                              src={`https://img.youtube.com/vi/${getYoutubeId(sermon.videoUrl || '')}/maxresdefault.jpg`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                              alt=""
                            />
                          ) : (
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                fontWeight: 900,
                                color: 'rgba(255,255,255,0.1)',
                                letterSpacing: '0.4em',
                              }}
                            >
                              VESPER
                            </div>
                          )}
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,1), transparent)' }} />
                          <div
                            className="vesper-badge badge-violet"
                            style={{ position: 'absolute', top: '16px', right: '16px', backdropFilter: 'blur(8px)' }}
                          >
                            {sermon.analysis?.clips?.length || 0} CLIPS
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, sermon._id)}
                            style={{
                              position: 'absolute',
                              top: '16px',
                              left: '16px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: 'rgba(255, 255, 255, 0.4)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              zIndex: 20,
                              backdropFilter: 'blur(10px)',
                            }}
                            title="Delete Harvest"
                          >
                            🗑️
                          </button>
                        </div>
                        <div style={{ padding: isPhone ? '16px' : '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <h3 style={{ fontSize: isPhone ? '16px' : '18px', fontWeight: 800, marginBottom: '8px' }}>{sermon.title}</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: isPhone ? '13px' : '14px', lineHeight: 1.5, height: '3em', overflow: 'hidden' }}>
                            {sermon.mainTheme || 'Neural analysis complete.'}
                          </p>
                          <div
                            style={{
                              marginTop: 'auto',
                              paddingTop: '20px',
                              borderTop: '1px solid rgba(255,255,255,0.05)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-dim)' }}>
                              {new Date(sermon.createdAt).toLocaleDateString()}
                            </span>
                            <span style={{ color: 'var(--primary)', fontSize: isPhone ? '12px' : '14px', fontWeight: 900 }}>VIEW ASSETS →</span>
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

      <SiteFooter />
    </main>
  );
}
