'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from 'react';
import ProcessingView from '@/components/home/ProcessingView';
import Pricing from '@/components/home/Pricing';
import HeroDemo from '@/components/home/HeroDemo';
import ShowcasePromo from '@/components/showcase/ShowcasePromo';
import LandingNav from '@/components/home/LandingNav';
import HeroImportHub from '@/components/home/HeroImportHub';
import ChurchSocialProof from '@/components/home/ChurchSocialProof';
import FAQ from '@/components/FAQ';
import { LandingStructuredData } from '@/components/seo/StructuredData';
import OnboardingModal, { useOnboarding } from '@/components/OnboardingModal';
import VideoTrimmer from '@/components/VideoTrimmer';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import {
  MAX_DIRECT_UPLOAD_BYTES,
  MAX_DIRECT_UPLOAD_LABEL,
  formatUploadLimitError,
  isWithinDirectUploadLimit,
} from '@/lib/uploadLimits';
import SiteFooter from '@/components/layout/SiteFooter';
import { useHeroCtaTest } from '@/lib/useHeroCtaTest';
import { isValidYouTubeUrl } from '@/lib/youtubeValidation';
import toast from 'react-hot-toast';
import { vesperFetch } from '@/lib/apiClient';
import { captureEvent } from '@/lib/analytics';
import { queueProcessingJob } from '@/lib/clientJobs';

const PROCESSING_STEPS = [
  { id: 'upload', label: 'Uploading…' },
  { id: 'analyze', label: 'Analyzing sermon…' },
  { id: 'moments', label: 'Finding key moments…' },
  { id: 'ready', label: 'Almost ready…' },
];

function getProcessingStepIndex(step?: string): number {
  if (!step) return 0;
  const normalized = step.toLowerCase();
  if (normalized.includes('queue') || normalized.includes('wait')) return 0;
  if (normalized.includes('upload')) return 0;
  if (normalized.includes('transcrib') || normalized.includes('engine')) return 1;
  if (normalized.includes('analy') || normalized.includes('process')) return 2;
  if (normalized.includes('download')) return 3;
  return 2;
}

async function validateYoutubeUrl(inputUrl: string): Promise<{ error: string | null; notice: string | null }> {
  const trimmed = inputUrl.trim();
  if (!trimmed) return { error: 'Please enter a YouTube link', notice: null };
  if (!isValidYouTubeUrl(trimmed)) return { error: 'Please enter a valid YouTube video URL', notice: null };

  try {
    const res = await fetch(`/api/youtube/validate?url=${encodeURIComponent(trimmed)}`);
    const data = await res.json();
    if (!data.ok) return { error: data.message as string, notice: null };
    return { error: null, notice: (data.liveNotice as string) || null };
  } catch {
    return { error: 'Could not verify this YouTube link. Check your connection and try again.', notice: null };
  }
}

export default function Home() {
  const { showOnboarding, completeOnboarding } = useOnboarding();
  const { isLoaded: authLoaded, userId } = useAuth();

  const finishOnboarding = useCallback(async () => {
    await completeOnboarding();
    requestAnimationFrame(() => {
      document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [completeOnboarding]);

  useEffect(() => {
    if (window.location.hash !== '#upload') return;
    requestAnimationFrame(() => {
      document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, []);
  const [url, setUrl] = useState('');
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [youtubeNotice, setYoutubeNotice] = useState<string | null>(null);
  const [youtubeValidating, setYoutubeValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [processingStartedAt, setProcessingStartedAt] = useState<number | null>(null);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [largeFile, setLargeFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobPollReady, setJobPollReady] = useState(false);
  const [status, setStatus] = useState<Record<string, string> | null>(null);
  const [lastSubmitUrl, setLastSubmitUrl] = useState('');
  const router = useRouter();
  const { label: heroCtaLabel, onCtaClick: onHeroCtaClick } = useHeroCtaTest();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const resetProcessing = () => {
    setIsProcessing(false);
    setProcessingError(null);
    setProcessingStartedAt(null);
    setStatus(null);
    setJobId(null);
    setJobPollReady(false);
  };

  const beginProcessing = (id: string) => {
    setJobId(id);
    setProcessingError(null);
    setProcessingStartedAt(Date.now());
    setStatus(null);
    setIsProcessing(true);
    setJobPollReady(true);
  };

  const handleProcess = async () => {
    setYoutubeError(null);
    setYoutubeNotice(null);
    setYoutubeValidating(true);
    const validation = await validateYoutubeUrl(url);
    setYoutubeValidating(false);
    if (validation.error) {
      setYoutubeError(validation.error);
      return;
    }
    if (validation.notice) setYoutubeNotice(validation.notice);

    const newJobId = Math.random().toString(36).substring(7);
    setLastSubmitUrl(url.trim());

    try {
      const queued = await queueProcessingJob('youtube', {
        url: url.trim(),
        jobId: newJobId,
      });
      if ('error' in queued) {
        const message =
          queued.code === 'LIMIT_REACHED'
            ? 'You have used all your clips this month. Upgrade to get more.'
            : queued.error;
        toast.error(message);
        return;
      }
      beginProcessing(queued.jobId);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Connection failed';
      toast.error(msg);
    }
  };

  const handleUrlChange = (nextUrl: string) => {
    setUrl(nextUrl);
    if (youtubeError) setYoutubeError(null);
    if (youtubeNotice) setYoutubeNotice(null);
  };

  useEffect(() => {
    if (!jobId || !isProcessing || !jobPollReady) return;

    let missingPolls = 0;

    const interval = setInterval(async () => {
      try {
        const [progressRes, jobRes] = await Promise.all([
          fetch(`/api/progress?jobId=${jobId}`),
          fetch(`/api/jobs/${jobId}`),
        ]);
        const data = progressRes.ok ? await progressRes.json() : null;
        const job = jobRes.ok ? await jobRes.json() : null;

        if (jobRes.status === 404) {
          missingPolls += 1;
          if (missingPolls >= 5) {
            setProcessingError('Lost track of your processing job. Please try again.');
            clearInterval(interval);
          }
          return;
        }
        missingPolls = 0;

        if (data) setStatus(data);

        if (job?.status === 'failed' || data?.status === 'error') {
          setProcessingError(
            job?.error ||
              data?.message?.replace(/^\[Neural Error\]\s*/, '') ||
              'Analysis failed. Please try again.'
          );
          return;
        }

        const finalPath = job?.finalPath || data?.finalPath;
        const hasAnalysis = Boolean(job?.analysis || data?.analysis);
        if (
          job?.status === 'complete' ||
          (data?.status === 'completed' && (finalPath || hasAnalysis))
        ) {
          router.push(`/results?jobId=${jobId}&videoUrl=${encodeURIComponent(finalPath || '')}`);
          clearInterval(interval);
        }
      } catch (e) {
        console.error('Progress check failed:', e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, isProcessing, jobPollReady, router]);

  // Handle trimmed file upload
  // Upload directly to R2 using presigned URL (bypasses server size limits)
  const uploadDirectToR2 = async (file: File, jobId: string): Promise<string> => {
    if (!isWithinDirectUploadLimit(file.size)) {
      throw new Error(formatUploadLimitError(file.size));
    }

    // Normalize empty Content-Types (extremely common in iOS/Safari audio and video recordings)
    let contentType = file.type;
    if (!contentType) {
      const nameLower = file.name.toLowerCase();
      if (nameLower.endsWith('.m4a')) contentType = 'audio/mp4';
      else if (nameLower.endsWith('.mp3')) contentType = 'audio/mpeg';
      else if (nameLower.endsWith('.wav')) contentType = 'audio/wav';
      else if (nameLower.endsWith('.mov')) contentType = 'video/quicktime';
      else contentType = 'video/mp4';
    }

    // Step 1: get presigned URL from server
    const urlRes = await vesperFetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, contentType, jobId, fileSizeBytes: file.size }),
    });
    if (!urlRes.ok) {
      const err = await urlRes.json();
      throw new Error(err.error || 'Failed to get upload URL');
    }
    const { uploadUrl, key } = await urlRes.json();

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
    });
    if (!putRes.ok) throw new Error(`Cloud storage upload failed (${putRes.status}). Please try again.`);

    const confirmRes = await vesperFetch('/api/upload-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    if (!confirmRes.ok) {
      const err = await confirmRes.json();
      throw new Error(err.error || 'Upload validation failed');
    }
    captureEvent('clip_created', { source_type: 'upload' });
    return key;
  };

  const handleFileUpload = async (file: File) => {
    if (!authLoaded) {
      toast.error('Checking your account… try again in a moment.');
      return;
    }
    if (!userId) {
      toast.error('Please sign in to upload a sermon.');
      return;
    }

    if (file.size > MAX_DIRECT_UPLOAD_BYTES) {
      const isMobileBrowser = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      if (isMobileBrowser) {
        toast.error(formatUploadLimitError(file.size));
        return;
      }
      toast(
        `File is ${Math.round(file.size / 1024 / 1024)}MB — opening trimmer to split it under ${MAX_DIRECT_UPLOAD_LABEL}. Tip: you can also download from YouTube as MP4 and compress with HandBrake first.`,
        { icon: '✂️', duration: 6000 }
      );
      setLargeFile(file);
      setShowTrimmer(true);
      return;
    }

    const loadToast = toast.loading(/\.(mp3|m4a|aac)$/i.test(file.name) ? 'Uploading audio file…' : 'Uploading media file…');
    const newJobId = Math.random().toString(36).substring(7);

    try {
      const r2Url = await uploadDirectToR2(file, newJobId);

      const queued = await queueProcessingJob('upload', {
        url: r2Url,
        jobId: newJobId,
      });
      if ('error' in queued) {
        toast.error(queued.error, { id: loadToast });
        return;
      }

      beginProcessing(queued.jobId);
      toast.success('Upload complete. Analysis queued!', { id: loadToast });
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : 'Upload failed';
      if (msg === 'Failed to fetch') {
        msg = 'Upload connection lost. If you are signed in, wait a moment and try again.';
      }
      toast.error(msg, { id: loadToast });
    }
  };

  const handleTrimComplete = async (trimmedFile: File, trimJobId: string) => {
    setShowTrimmer(false);

    const loadToast = toast.loading('Uploading trimmed video...');
    try {
      const r2Url = await uploadDirectToR2(trimmedFile, trimJobId);

      const queued = await queueProcessingJob('upload', {
        url: r2Url,
        jobId: trimJobId,
      });
      if ('error' in queued) {
        toast.error(queued.error, { id: loadToast });
        return;
      }

      beginProcessing(queued.jobId);
      toast.success('Trimmed video uploaded! Processing queued.', { id: loadToast });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg, { id: loadToast });
    }
  };

  // Show trimmer view
  if (showTrimmer) {
    return (
      <VideoTrimmer
        initialFile={largeFile}
        onTrimComplete={handleTrimComplete}
        onCancel={() => {
          setShowTrimmer(false);
          setLargeFile(null);
        }}
      />
    );
  }

  if (isProcessing) {
    return (
      <main className="vesper-mesh-bg-container processing-screen">
        <div className="vesper-mesh-bg" />
        <div className="processing-screen-inner animate-in">
          <div className="glass-card premium-border processing-screen-card">
            <ProcessingView
              steps={PROCESSING_STEPS}
              currentStepIndex={getProcessingStepIndex(status?.step)}
              statusMessage={status?.message || PROCESSING_STEPS[0].label}
              startedAt={processingStartedAt ?? undefined}
              error={processingError}
              onRetry={() => {
                resetProcessing();
                if (lastSubmitUrl) {
                  setUrl(lastSubmitUrl);
                  void handleProcess();
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <LandingStructuredData />
    <main
      className="vesper-mesh-bg-container"
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <div className="vesper-mesh-bg" />

      <LandingNav />

      {/* Hero Section */}
      <section
        style={{
          padding: isMobile ? '48px 16px 48px' : '64px 20px 80px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div className="animate-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="vesper-badge badge-violet" style={{ marginBottom: '40px', padding: '12px 24px' }}>
            <span style={{ fontSize: '16px', marginRight: '8px' }}>✨</span> The next evolution of ministry
            media
          </div>

          <div
            className="animate-in"
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? '24px' : 'clamp(16px, 4vw, 48px)',
              marginBottom: '48px',
            }}
          >
            <img
              src="/vesper-logo-icon.png"
              alt="Vesper Studio logo"
              style={{
                height: isMobile ? '120px' : 'clamp(64px, 15vw, 200px)',
                width: 'auto',
                filter: 'drop-shadow(0 0 30px rgba(139,92,246,0.3))',
              }}
            />
            <h1
              className="title-xl"
              style={{
                fontSize: isMobile ? '48px' : 'clamp(48px, 12vw, 160px)',
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1,
                textAlign: 'center',
              }}
            >
              <span style={{ color: '#8B5CF6' }}>VES</span>PER
            </h1>
          </div>

          <p
            className="title-xl"
            style={{
              fontSize: 'clamp(24px, 5vw, 48px)',
              fontWeight: 300,
              marginBottom: '48px',
              color: 'var(--text-muted)',
              textTransform: 'none',
            }}
          >
            Cinematic Reels. <span className="accent-text">Neural Precision.</span>
          </p>

          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '20px',
              maxWidth: '720px',
              margin: '0 auto 40px',
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            Automatically distill your powerful sermons into high-impact cinematic reels that reach more
            hearts on every platform.
          </p>

          <HeroDemo />
          <ShowcasePromo variant="public" />

          <HeroImportHub
            isMobile={isMobile}
            onFileSelect={handleFileUpload}
            youtubeUrl={url}
            youtubeError={youtubeError}
            youtubeNotice={youtubeNotice}
            youtubeValidating={youtubeValidating}
            onYoutubeUrlChange={handleUrlChange}
            onYoutubeSubmit={handleProcess}
            onPodcastProcessingStart={beginProcessing}
          />
        </div>
      </section>

      {/* Vision Section */}
      <section
        id="how-it-works"
        className="landing-anchor"
        style={{ padding: '160px 20px', position: 'relative' }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '100px' }}>
            <div className="vesper-badge badge-violet" style={{ marginBottom: '24px' }}>
              The Vision
            </div>
            <h2 className="title-xl" style={{ fontSize: 'clamp(32px, 5vw, 64px)', marginBottom: '32px' }}>
              Beyond Technology: <span className="accent-text">Our Ministry</span>
            </h2>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '20px',
                maxWidth: '800px',
                margin: '0 auto',
                lineHeight: 1.6,
              }}
            >
              Vesper was born from a simple conviction: the Gospel should be shared with the same cinematic
              excellence that the world uses to capture attention.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '32px',
            }}
          >
            {[
              {
                title: 'Neural Selection',
                icon: '🧠',
                desc: "Our AI doesn't just clip video; it understands theological context to find the moments that will change lives.",
              },
              {
                title: 'Social Stewardship',
                icon: '📱',
                desc: 'Direct-to-platform publishing ensures your ministry stays consistent without overwhelming your team.',
              },
              {
                title: 'Global Impact',
                icon: '🌎',
                desc: 'By optimizing for short-form, we help your church message cross borders and reach a digital generation.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="glass-card premium-border animate-in"
                style={{ padding: '48px', animationDelay: `${i * 0.1}s` }}
              >
                <div
                  style={{
                    fontSize: '56px',
                    marginBottom: '32px',
                    filter: 'drop-shadow(0 0 15px rgba(139,92,246,0.2))',
                  }}
                >
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '20px' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '17px', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Pricing />

      <FAQ />

      {/* Testimonials Section */}
      <section style={{ padding: '120px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <span className="section-subtitle">Community Feedback</span>
          <h2 className="section-title">What Pastors Are Saying</h2>

          <div className="testimonials-grid">
            {[
              {
                text: 'Vesper has completely transformed our social media presence. What used to take our tech team 10 hours now takes 10 minutes.',
                author: 'Pastor David M.',
                church: 'First Baptist Church, Nashville',
              },
              {
                text: 'The quality of the AI-generated clips is incredible. It captures the heart of the message perfectly every single time.',
                author: 'Sarah J.',
                church: 'Grace Community Church, Austin',
              },
            ].map((t, i) => (
              <div key={i} className="testimonial-card">
                <p style={{ marginBottom: '24px' }}>&ldquo;{t.text}&rdquo;</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1F1F24' }}
                  />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800 }}>{t.author}</div>
                    <div style={{ fontSize: '12px', color: '#8B5CF6', marginTop: '2px' }}>{t.church}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '120px 20px', textAlign: 'center' }}>
        <div
          className="glass-card premium-border animate-in"
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            padding: '100px 48px',
            background: 'var(--primary-glow)',
          }}
        >
          <h2 className="title-xl" style={{ fontSize: 'clamp(32px, 6vw, 56px)', marginBottom: '32px' }}>
            Ready to amplify your message?
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '20px',
              marginBottom: '32px',
              maxWidth: '700px',
              margin: '0 auto 32px',
            }}
          >
            Join a growing community of churches using Vesper to reach more people with the Gospel.
          </p>
          <ChurchSocialProof />
          <button
            onClick={() => {
              onHeroCtaClick();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="vesper-btn vesper-btn-primary shimmer-effect"
            style={{ padding: '16px 48px', fontSize: '18px', marginTop: '40px' }}
          >
            {heroCtaLabel.toUpperCase()}
          </button>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />

      {/* Onboarding Modal — shows on first visit */}
      {showOnboarding && <OnboardingModal onComplete={finishOnboarding} onSkip={finishOnboarding} />}
    </main>
    </>
  );
}
