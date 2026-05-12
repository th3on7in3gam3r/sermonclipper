'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';
import ProcessingView from '@/components/home/ProcessingView';
import Pricing from '@/components/home/Pricing';
import FAQ from '@/components/FAQ';
import OnboardingModal, { useOnboarding } from '@/components/OnboardingModal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, SignInButton, UserButton } from '@clerk/nextjs';
import toast from 'react-hot-toast';

export default function Home() {
  const { needsOnboarding, setNeedsOnboarding } = useOnboarding();
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
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

  if (isProcessing) {
    return (
      <main className="flex-center" style={{ minHeight: '100vh', padding: '20px', background: '#0A0A0F' }}>
        <div className="spiritual-rays" />
        <div className="animate-up" style={{ width: '100%', maxWidth: '600px' }}>
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
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="spiritual-rays" />
      <div className="cross-motif" />
      
      {/* Navigation */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', zIndex: 1000, background: 'rgba(10, 10, 15, 0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/vesper-logo-icon.png" alt="Logo" style={{ height: '36px', width: 'auto', mixBlendMode: 'screen', display: 'block' }} />
          <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '0.4em', color: '#fff', display: 'flex', alignItems: 'center' }}>VESPER</div>
        </div>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <Link href="/#features" style={{ textDecoration: 'none', fontSize: '13px', fontWeight: 600, color: '#A1A1AA' }}>Vision</Link>
          <Link href="/#pricing" style={{ textDecoration: 'none', fontSize: '13px', fontWeight: 600, color: '#A1A1AA' }}>Pricing</Link>
          {isLoaded && userId ? (
            <>
              <Link href="/dashboard" style={{ textDecoration: 'none', fontSize: '13px', fontWeight: 600, color: '#fff' }}>Dashboard</Link>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <UserButton />
              </div>
            </>
          ) : (
            <SignInButton mode="modal">
              <button style={{ background: '#8B5CF6', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Sign In</button>
            </SignInButton>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '200px 20px 100px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="animate-up">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2em', marginBottom: '60px' }}>
            <img 
              src="/vesper-logo-icon.png" 
              alt="VESPER Icon" 
              style={{ 
                height: 'clamp(64px, 15vw, 180px)', 
                width: 'auto', 
                objectFit: 'contain', 
                mixBlendMode: 'screen',
                display: 'block'
              }}
            />
            <h1 className="hero-title" style={{ 
              margin: 0, 
              fontSize: 'clamp(48px, 10vw, 140px)',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center'
            }}>VESPER</h1>
          </div>
          
          <p className="hero-tagline">
            Turn powerful sermons into short-form content that reaches more hearts. Our Neural Engine finds the most impactful moments automatically.
          </p>

          <div className="input-wrapper animate-up" style={{ animationDelay: '0.2s' }}>
            <input 
              type="text" 
              placeholder="Paste YouTube sermon link here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleProcess()}
            />
            <button onClick={handleProcess} className="primary-btn">Process Sermon</button>
          </div>

          <div className="luxury-divider animate-up" style={{ animationDelay: '0.4s' }}>
            <span>OR UPLOAD VIDEO FILE</span>
          </div>

          <input 
            type="file" 
            id="video-upload" 
            accept="video/*" 
            style={{ display: 'none' }} 
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const loadToast = toast.loading('Uploading to Sanctum...');
              const newJobId = Math.random().toString(36).substring(7);
              setJobId(newJobId);
              setIsProcessing(true);

              try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('jobId', newJobId);

                const res = await fetch('/api/upload', {
                  method: 'POST',
                  body: formData
                });

                if (!res.ok) throw new Error('Upload failed');
                const { url: r2Url } = await res.json();

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
            className="glass-panel animate-up" 
            onClick={() => document.getElementById('video-upload')?.click()}
            style={{ animationDelay: '0.6s', maxWidth: '800px', margin: '0 auto', padding: '60px', borderStyle: 'dashed', borderWidth: '2px', cursor: 'pointer' }}
          >
             <div style={{ fontSize: '40px', marginBottom: '16px' }}>📁</div>
             <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Drag & Drop Your Sermon Video</h3>
             <p style={{ color: '#52525B', fontSize: '14px' }}>MP4, MOV, or WEBM (Max 2GB)</p>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="features" style={{ padding: '120px 20px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <span className="section-subtitle">THE VISION</span>
            <h2 className="section-title">Beyond Technology: Our Ministry</h2>
            <p style={{ color: '#A1A1AA', fontSize: '18px', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
              Vesper was born from a simple conviction: the Gospel should be shared with the same cinematic excellence that the world uses to capture attention. We build tools that empower pastors to reach the harvest.
            </p>
          </div>
          
          <div className="features-grid">
            {[
              { title: 'Neural Selection', icon: '🧠', desc: "Our AI doesn't just clip video; it understands theological context to find the moments that will change lives." },
              { title: 'Social Stewardship', icon: '📱', desc: 'Direct-to-platform publishing ensures your ministry stays consistent without overwhelming your team.' },
              { title: 'Global Impact', icon: '🌎', desc: 'By optimizing for short-form, we help your church message cross borders and reach a digital generation.' }
            ].map((f, i) => (
              <div key={i} className="glass-panel feature-card" style={{ padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '24px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '16px' }}>{f.title}</h3>
                <p style={{ color: '#A1A1AA', lineHeight: 1.6 }}>{f.desc}</p>
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
      <section style={{ padding: '100px 20px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 40px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(244, 185, 66, 0.05))' }}>
           <h2 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '24px' }}>Ready to amplify your message?</h2>
           <p style={{ color: '#A1A1AA', fontSize: '18px', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>Join 500+ churches using Vesper to reach more people with the Gospel.</p>
           <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="primary-btn">Get Started Now</button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '80px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'center', gap: '40px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.2em', opacity: 0.4, marginBottom: '16px' }}>
          <Link href="/privacy" style={{ color: '#fff', textDecoration: 'none' }}>PRIVACY POLICY</Link>
          <Link href="/terms" style={{ color: '#fff', textDecoration: 'none' }}>TERMS OF SERVICE</Link>
          <span style={{ color: '#fff' }}>© 2026 VESPER</span>
        </div>
        <p style={{ fontSize: '12px', color: '#52525B', fontWeight: 600 }}>
          Made by <a href="https://biblefunland.com" target="_blank" rel="noreferrer" style={{ color: '#8B5CF6', textDecoration: 'none', fontWeight: 800 }}>BIBLEFUNLAND</a> STUDIOS
        </p>
      </footer>

      {/* Onboarding Modal — shows on first visit */}
      {needsOnboarding && (
        <OnboardingModal onComplete={() => setNeedsOnboarding(false)} />
      )}
    </main>
  );
}
