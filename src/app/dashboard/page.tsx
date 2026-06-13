'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DashboardSignInGate from '@/components/dashboard/DashboardSignInGate';
import ClipLibrary, { type SermonRecord } from '@/components/dashboard/ClipLibrary';
import QuotaDisplay from '@/components/dashboard/QuotaDisplay';
import NotificationBell from '@/components/dashboard/NotificationBell';
import NpsSurvey from '@/components/dashboard/NpsSurvey';
import WhatsNewBell from '@/components/dashboard/WhatsNewBell';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { ShortcutsHelpPanel, useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';
import SiteFooter from '@/components/layout/SiteFooter';
import OnboardingModal, { useOnboarding } from '@/components/OnboardingModal';
import StudioHelpShell from '@/components/help/StudioHelpShell';
import HelpNavButton from '@/components/help/HelpNavButton';
import { vesperClerkAppearance } from '@/lib/clerkAppearance';

function DashboardContent() {
  const { isLoaded, userId } = useAuth();
  const searchParams = useSearchParams();
  const forceOnboarding = searchParams.get('onboarding') === '1';
  const { showOnboarding, completeOnboarding } = useOnboarding(forceOnboarding);

  const [sermons, setSermons] = useState<SermonRecord[]>([]);
  const [userData, setUserData] = useState<{
    plan?: string;
    usageCount?: number;
    limit?: number;
    lastUsageReset?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(1280);
  const [clipActions, setClipActions] = useState<{
    exportSelected?: () => void;
    deleteSelected?: () => void;
    focusIndex?: (delta: number) => void;
  }>({});

  const { showHelp, setShowHelp } = useKeyboardShortcuts(
    [
      {
        key: 'u',
        label: 'Upload sermon',
        action: () => {
          window.location.href = '/#upload';
        },
      },
      {
        key: 'y',
        label: 'Focus YouTube input',
        action: () => {
          window.location.href = '/#upload';
        },
      },
      {
        key: 'n',
        label: 'New clip',
        action: () => {
          window.location.href = '/#upload';
        },
      },
      { key: 'e', label: 'Export selected clip', action: () => clipActions.exportSelected?.() },
      { key: 'd', label: 'Delete selected clip', action: () => clipActions.deleteSelected?.() },
      { key: 'ArrowUp', label: 'Previous clip', action: () => clipActions.focusIndex?.(-1) },
      { key: 'ArrowDown', label: 'Next clip', action: () => clipActions.focusIndex?.(1) },
      { key: 'ArrowLeft', label: 'Previous clip', action: () => clipActions.focusIndex?.(-1) },
      { key: 'ArrowRight', label: 'Next clip', action: () => clipActions.focusIndex?.(1) },
    ],
    Boolean(userId)
  );

  useEffect(() => {
    if (forceOnboarding && userId) {
      void import('@/lib/useHeroCtaTest').then((m) => m.trackHeroSignupConversion(userId));
    }
  }, [forceOnboarding, userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch('/api/sermons').then((res) => res.json()),
      fetch('/api/user/status').then((res) => res.json()),
    ])
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

  const handleDelete = async (sermonIds: string[]) => {
    const res = await fetch(`/api/sermons?ids=${sermonIds.join(',')}`, { method: 'DELETE' });
    if (res.ok) {
      setSermons((prev) => prev.filter((s) => !sermonIds.includes(s._id)));
    } else {
      throw new Error('Delete failed');
    }
  };

  if (isLoaded && !userId) {
    return <DashboardSignInGate />;
  }

  return (
    <main
      className="vesper-mesh-bg-container"
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
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
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: isPhone ? '8px' : '12px',
            minWidth: 0,
          }}
        >
          <img
            src="/vesper-logo-icon.png"
            alt="Vesper Studio logo"
            style={{ height: isPhone ? '26px' : '32px', width: 'auto', flexShrink: 0 }}
          />
          {!isPhone && (
            <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '0.15em', color: '#fff' }}>
              <span style={{ color: '#8B5CF6' }}>VES</span>PER
            </div>
          )}
        </Link>
        <div
          style={{
            display: 'flex',
            gap: isPhone ? '6px' : isMobile ? '10px' : '20px',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {!isPhone && userData && (
            <QuotaDisplay
              compact
              usageCount={userData.usageCount}
              limit={userData.limit}
              lastUsageReset={userData.lastUsageReset}
            />
          )}
          <NotificationBell />
          <WhatsNewBell />
          <HelpNavButton />
          <ThemeToggle />
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

      <div
        style={{
          maxWidth: '1400px',
          margin: isPhone ? '96px auto 0' : '140px auto 0',
          padding: isMobile ? '0 12px' : '0 40px',
          position: 'relative',
          zIndex: 10,
          width: '100%',
        }}
      >
        <div style={{ marginBottom: isPhone ? '20px' : '32px' }}>
          <div className="vesper-badge badge-violet" style={{ marginBottom: '16px' }}>
            NEURAL ARCHIVE
          </div>
          <h1
            className="title-xl gradient-text"
            style={{ fontSize: isPhone ? '40px' : 'clamp(32px, 6vw, 64px)', marginBottom: '12px' }}
          >
            YOUR <span className="accent-text">HARVEST</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: isPhone ? '15px' : '18px', maxWidth: '600px' }}>
            Manage your cinematic ministry assets and social media reels across all series.
          </p>
        </div>

        <DashboardOverview userData={userData} isPhone={isPhone} />

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
            <p
              style={{ color: 'var(--text-dim)', fontSize: '16px', fontWeight: 900, letterSpacing: '0.2em' }}
            >
              SYNCHRONIZING NEURAL ARCHIVES...
            </p>
          </div>
        ) : (
          <ClipLibrary
            sermons={sermons}
            plan={userData?.plan}
            onDelete={handleDelete}
            isPhone={isPhone}
            registerActions={setClipActions}
          />
        )}
      </div>

      {showHelp && (
        <ShortcutsHelpPanel
          actions={[
            { key: 'U', label: 'Upload sermon' },
            { key: 'Y', label: 'Focus YouTube input' },
            { key: 'N', label: 'New clip' },
            { key: 'E', label: 'Export selected clip' },
            { key: 'D', label: 'Delete selected clip' },
            { key: '←/→', label: 'Navigate clips' },
          ]}
          onClose={() => setShowHelp(false)}
        />
      )}

      {showOnboarding && <OnboardingModal onComplete={completeOnboarding} onSkip={completeOnboarding} />}

      <NpsSurvey clipCount={userData?.usageCount || 0} accountAgeDays={30} />

      <SiteFooter />
    </main>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={null}>
      <StudioHelpShell>
        <DashboardContent />
      </StudioHelpShell>
    </Suspense>
  );
}
