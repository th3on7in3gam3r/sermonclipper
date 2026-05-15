'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';
import ProcessingView from '@/components/home/ProcessingView';
import Pricing from '@/components/home/Pricing';
import FAQ from '@/components/FAQ';
import OnboardingModal, { useOnboarding } from '@/components/OnboardingModal';
import VideoTrimmer from '@/components/VideoTrimmer';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, SignInButton, UserButton } from '@clerk/nextjs';
import toast from 'react-hot-toast';

export default function Home() {
  const { needsOnboarding, setNeedsOnboarding } = useOnboarding();
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [largeFile, setLargeFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, string> | null>(null);
  const router = useRouter();
  const { isLoaded, userId } = useAuth();

  const handleProcess = async () => {
    if (!url) return;
    const newJobId = Math.random().toString(36).substring(7);
    setJobId(newJobId);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/download-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, jobId: newJobId, userId }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        toast.error(`Neural Engine Error: ${errorData.details || 'Unknown system failure'}`);
        setIsProcessing(false);
        return;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Connection failed';
      console.error('Failed to start job:', error);
      toast.error(`Connection failed: ${msg}`);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!jobId || !isProcessing) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/progress?jobId=${jobId}`);
        const data = await res.json();
        if (data) {
          setStatus(data);
          if (data.status === 'completed' && data.finalPath) {
            router.push(`/results?jobId=${jobId}&videoUrl=${encodeURIComponent(data.finalPath)}`);
            clearInterval(interval);
          }
        }
      } catch (e) {
        console.error('Progress check failed:', e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, isProcessing, router]);

  // Handle trimmed file upload
  // Upload directly to R2 using presigned URL (bypasses server size limits)
  const uploadDirectToR2 = async (file: File, jobId: string): Promise<string> => {
    // Step 1: get presigned URL from server
    const urlRes = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, contentType: file.type || 'video/mp4', jobId }),
    });
    if (!urlRes.ok) {
      const err = await urlRes.json();
      throw new Error(err.error || 'Failed to get upload URL');
    }
    const { uploadUrl, publicUrl } = await urlRes.json();

    // Step 2: PUT file directly to R2 (no server in middle, no size limit)
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'video/mp4' },
      body: file,
    });
    if (!putRes.ok) throw new Error(`R2 upload failed: ${putRes.status}`);

    return publicUrl;
  };

  const handleTrimComplete = async (trimmedFile: File, trimJobId: string) => {
    setShowTrimmer(false);
    setJobId(trimJobId);
    setIsProcessing(true);

    const loadToast = toast.loading('Uploading trimmed video...');
    try {
      // Direct browser-to-R2 upload (no proxy size limits)
      const r2Url = await uploadDirectToR2(trimmedFile, trimJobId);

      await fetch('/api/download-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: r2Url, jobId: trimJobId, userId }),
      });

      toast.success('Trimmed video uploaded! Processing started.', { id: loadToast });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg, { id: loadToast });
      setIsProcessing(false);
    }
  };

  // Show trimmer view
  if (showTrimmer) {
    return (
      <VideoTrimmer
        initialFile={largeFile}
        onTrimComplete={handleTrimComplete}
        onCancel={() => { setShowTrimmer(false); setLargeFile(null); }}
      />
    );
  }

  if (isProcessing) {
    return (
      <main className="vesper-mesh-bg-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="vesper-mesh-bg" />
        <div className="animate-in" style={{ width: '100%', maxWidth: '640px', position: 'relative', zIndex: 10, padding: '24px' }}>
          <div className="glass-card premium-border" style={{ padding: '48px', textAlign: 'center' }}>
            <ProcessingView 
              steps={[
                { id: 'engine', label: 'Extracting Audio track' },
                { id: 'transcribe', label: 'Neural Transcription' },
                { id: 'analysis', label: 'Analyzing moments' },
                { id: 'visuals', label: 'Generating Reels' }
              ]}
              currentStepIndex={status?.step === 'Uploading' ? 0 : status?.step === 'Transcribing' ? 1 : 2}
              statusMessage={status?.message || 'Initializing Neural Engine...'}
            />
          </div>
        </div>
      </main>
    );
  }

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
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/vesper-logo-icon.png" alt="VESPER" style={{ height: '32px', width: 'auto' }} />
          <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '0.15em', color: '#fff' }}>
            <span style={{ color: '#8B5CF6' }}>VES</span>PER
          </div>
        </Link>

        <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <Link href="/#features" className="vesper-btn-outline" style={{ border: 'none', background: 'transparent', fontSize: '13px', color: 'var(--text-muted)' }}>VISION</Link>
          <Link href="/#pricing" className="vesper-btn-outline" style={{ border: 'none', background: 'transparent', fontSize: '13px', color: 'var(--text-muted)' }}>PRICING</Link>
          {isLoaded && userId ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/dashboard" className="vesper-btn-outline" style={{ padding: '8px 20px', fontSize: '13px' }}>DASHBOARD</Link>
              <UserButton />
            </div>
          ) : (
            <SignInButton mode="modal">
              <button className="vesper-btn vesper-btn-primary shimmer-effect" style={{ padding: '10px 24px', fontSize: '13px' }}>SIGN IN</button>
            </SignInButton>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '180px 20px 80px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="animate-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="vesper-badge badge-violet" style={{ marginBottom: '40px', padding: '12px 24px' }}>
            <span style={{ fontSize: '16px', marginRight: '8px' }}>✨</span> THE NEXT EVOLUTION OF MINISTRY MEDIA
          </div>
          
          <h1 className="title-xl" style={{ fontSize: 'clamp(48px, 12vw, 160px)', marginBottom: '40px', letterSpacing: '-0.02em' }}>
            <span style={{ color: '#8B5CF6' }}>VES</span>PER
          </h1>
          
          <p className="title-xl" style={{ fontSize: 'clamp(24px, 5vw, 48px)', fontWeight: 300, marginBottom: '48px', color: 'var(--text-muted)' }}>
            Cinematic Reels. <span className="accent-text">Neural Precision.</span>
          </p>

          <p style={{ color: 'var(--text-muted)', fontSize: '20px', maxWidth: '720px', margin: '0 auto 64px', lineHeight: 1.6, fontWeight: 400 }}>
            Automatically distill your powerful sermons into high-impact cinematic reels that reach more hearts on every platform.
          </p>

          <div className="glass-card premium-border" style={{ maxWidth: '800px', margin: '0 auto 40px', padding: '8px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Paste YouTube sermon link here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleProcess()}
                style={{ 
                  flex: 1, background: 'transparent', border: 'none', padding: '16px 24px', 
                  color: '#fff', fontSize: '16px', outline: 'none' 
                }}
              />
              <button onClick={handleProcess} className="vesper-btn vesper-btn-primary shimmer-effect" style={{ padding: '0 32px' }}>HARVEST NOW</button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '40px', opacity: 0.4 }}>
            <div style={{ height: '1px', width: '60px', background: 'currentColor' }} />
            <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.2em' }}>OR UPLOAD CINEMATIC SOURCE</span>
            <div style={{ height: '1px', width: '60px', background: 'currentColor' }} />
          </div>

          <input 
            type="file" 
            id="video-upload" 
            accept="video/*" 
            style={{ display: 'none' }} 
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              // Files over 500MB → open trimmer to split into segments
              const TRIMMER_THRESHOLD = 500 * 1024 * 1024; // 500MB
              if (file.size > TRIMMER_THRESHOLD) {
                toast(`File is ${Math.round(file.size / 1024 / 1024)}MB — opening trimmer to split it down.`, { icon: '✂️' });
                setLargeFile(file);
                setShowTrimmer(true);
                return;
              }

              // Direct browser-to-R2 upload via presigned URL (bypasses proxy limits)
              const loadToast = toast.loading('Uploading to Sanctum...');
              const newJobId = Math.random().toString(36).substring(7);
              setJobId(newJobId);
              setIsProcessing(true);

              try {
                const r2Url = await uploadDirectToR2(file, newJobId);

                await fetch('/api/download-youtube', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: r2Url, jobId: newJobId, userId }),
                });

                toast.success('Upload complete. Neural Harvesting started!', { id: loadToast });
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Upload failed';
                toast.error(msg, { id: loadToast });
                setIsProcessing(false);
              }
            }}
          />

          <div 
            className="glass-card premium-border animate-in" 
            onClick={() => document.getElementById('video-upload')?.click()}
            style={{ 
              animationDelay: '0.4s', maxWidth: '800px', margin: '0 auto', padding: '64px', 
              borderStyle: 'dashed', borderWidth: '2px', cursor: 'pointer',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
             <div style={{ fontSize: '48px', marginBottom: '24px', filter: 'drop-shadow(0 0 20px rgba(139,92,246,0.3))' }}>📁</div>
             <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '12px' }}>Drag & Drop Master Session</h3>
             <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '24px' }}>MP4, MOV, or WEBM (Max 500MB)</p>
             <div className="vesper-badge badge-gold" style={{ padding: '10px 20px', borderRadius: '12px' }}>
                SEGMENTED UPLOAD ACTIVE FOR LARGER FILES
             </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="features" style={{ padding: '160px 20px', position: 'relative' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '100px' }}>
            <div className="vesper-badge badge-violet" style={{ marginBottom: '24px' }}>THE VISION</div>
            <h2 className="title-xl" style={{ fontSize: 'clamp(32px, 5vw, 64px)', marginBottom: '32px' }}>
              Beyond Technology: <span className="accent-text">Our Ministry</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '20px', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
              Vesper was born from a simple conviction: the Gospel should be shared with the same cinematic excellence that the world uses to capture attention.
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px' }}>
            {[
              { title: 'Neural Selection', icon: '🧠', desc: "Our AI doesn't just clip video; it understands theological context to find the moments that will change lives." },
              { title: 'Social Stewardship', icon: '📱', desc: 'Direct-to-platform publishing ensures your ministry stays consistent without overwhelming your team.' },
              { title: 'Global Impact', icon: '🌎', desc: 'By optimizing for short-form, we help your church message cross borders and reach a digital generation.' }
            ].map((f, i) => (
              <div key={i} className="glass-card premium-border animate-in" style={{ padding: '48px', animationDelay: `${i * 0.1}s` }}>
                <div style={{ fontSize: '56px', marginBottom: '32px', filter: 'drop-shadow(0 0 15px rgba(139,92,246,0.2))' }}>{f.icon}</div>
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
              { text: "Vesper has completely transformed our social media presence. What used to take our tech team 10 hours now takes 10 minutes.", author: "Pastor David M.", role: "Lead Pastor" },
              { text: "The quality of the AI-generated clips is incredible. It captures the heart of the message perfectly every single time.", author: "Sarah J.", role: "Media Director" }
            ].map((t, i) => (
              <div key={i} className="testimonial-card">
                <p style={{ marginBottom: '24px' }}>&ldquo;{t.text}&rdquo;</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1F1F24' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 900 }}>{t.author}</div>
                    <div style={{ fontSize: '12px', color: '#8B5CF6' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '120px 20px', textAlign: 'center' }}>
        <div className="glass-card premium-border animate-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '100px 48px', background: 'var(--primary-glow)' }}>
           <h2 className="title-xl" style={{ fontSize: 'clamp(32px, 6vw, 56px)', marginBottom: '32px' }}>Ready to amplify your message?</h2>
           <p style={{ color: 'var(--text-muted)', fontSize: '20px', marginBottom: '48px', maxWidth: '700px', margin: '0 auto 48px' }}>Join 500+ churches using Vesper to reach more people with the Gospel.</p>
           <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="vesper-btn vesper-btn-primary shimmer-effect" style={{ padding: '16px 48px', fontSize: '18px' }}>GET STARTED NOW</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-card" style={{ padding: '80px 20px', borderRadius: '48px 48px 0 0', borderBottom: 'none', borderLeft: 'none', borderRight: 'none', textAlign: 'center', background: 'rgba(0,0,0,0.5)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'center', gap: '40px', fontSize: '11px', fontWeight: 900, letterSpacing: '0.3em', opacity: 0.6, marginBottom: '24px' }}>
          <Link href="/privacy" style={{ color: '#fff', textDecoration: 'none' }}>PRIVACY POLICY</Link>
          <Link href="/terms" style={{ color: '#fff', textDecoration: 'none' }}>TERMS OF SERVICE</Link>
          <span style={{ color: '#fff' }}>© 2026 VESPER</span>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-dim)', fontWeight: 600 }}>
          Made by <a href="https://www.biblefunlandstudios.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 800 }}>BIBLEFUNLAND</a> STUDIOS
        </p>
      </footer>

      {/* Onboarding Modal — shows on first visit */}
      {needsOnboarding && (
        <OnboardingModal onComplete={() => setNeedsOnboarding(false)} />
      )}
    </main>
  );
}
