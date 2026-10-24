'use client';

import { useState, useEffect, useCallback } from 'react';
import Pricing from '@/components/home/Pricing';
import HeroDemo from '@/components/home/HeroDemo';
import ShowcasePromo from '@/components/showcase/ShowcasePromo';
import LandingNav from '@/components/home/LandingNav';
import HeroImportHub from '@/components/home/HeroImportHub';
import ChurchSocialProof from '@/components/home/ChurchSocialProof';
import FAQ from '@/components/FAQ';
import { LandingStructuredData } from '@/components/seo/StructuredData';
import dynamic from 'next/dynamic';
import { useOnboarding } from '@/components/useOnboarding';

const OnboardingModal = dynamic(() => import('@/components/OnboardingModal'), { ssr: false });
const ProcessingView = dynamic(() => import('@/components/home/ProcessingView'), { ssr: false });
const VideoTrimmer = dynamic(() => import('@/components/VideoTrimmer'), { ssr: false });
import { useRouter } from 'next/navigation';
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

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <h1 className="landing-hero-title">Your Sunday sermon, ready for this week&rsquo;s feed.</h1>
          <p className="landing-hero-lede">
            Upload the message. Vesper finds the moments worth sharing, captions them, and exports vertical
            reels for Instagram, TikTok and YouTube Shorts.
          </p>

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

          <HeroDemo />
          <ShowcasePromo variant="public" />
        </div>
      </section>

      <section id="how-it-works" className="landing-anchor landing-section">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Made for the people who run church media</h2>
          <p className="landing-section-lede">
            Most church media teams are volunteers with an hour on Sunday afternoon. Vesper does the
            scrubbing, cutting and captioning so that hour goes to choosing what to post.
          </p>
          <div className="landing-points">
            {[
              {
                title: 'It finds the moments',
                desc: 'Vesper listens to the whole message and pulls out the passages that stand on their own: the illustration, the turn, the line people will repeat.',
              },
              {
                title: 'It does the formatting',
                desc: 'Every reel comes cropped to 9:16 with captions in the style you choose, so there is nothing left to fix in another app.',
              },
              {
                title: 'You stay in charge',
                desc: 'Trim, rewrite a caption or swap the style before you export. Nothing posts until you decide it should.',
              },
            ].map((f) => (
              <div key={f.title} className="landing-point">
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
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
                    <div style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '2px' }}>{t.church}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-final">
        <div className="landing-final-card">
          <h2 className="landing-section-title">Turn this Sunday&rsquo;s sermon into a week of posts.</h2>
          <p className="landing-section-lede">
            Join the churches already using Vesper to carry the message past Sunday morning.
          </p>
          <ChurchSocialProof />
          <button
            type="button"
            onClick={() => {
              onHeroCtaClick();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="vesper-btn vesper-btn-primary landing-final-cta"
          >
            {heroCtaLabel}
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
