'use client';

import { useState, useEffect } from 'react';
import ProcessingView from '@/components/home/ProcessingView';
import { useRouter } from 'next/navigation';
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import toast from 'react-hot-toast';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const router = useRouter();

  const handleProcess = async () => {
    if (!url) return;
    const newJobId = Math.random().toString(36).substring(7);
    setJobId(newJobId);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/download-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, jobId: newJobId }),
      });
      
      if (res.status === 401) {
        toast.error('Sign in required to harvest sermons.');
        setIsProcessing(false);
        return;
      }
    } catch (error) {
      console.error('Failed to start job:', error);
      toast.error('Connection failed.');
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
      <main className="flex-center" style={{ minHeight: '100vh', padding: '20px' }}>
        <div className="spiritual-rays" />
        <ProcessingView 
          steps={[
            { id: 'engine', label: 'Extracting Audio track' },
            { id: 'transcribe', label: 'Neural Transcription' },
            { id: 'analysis', label: 'Analyzing moments' },
            { id: 'visuals', label: 'Generating Reels' }
          ]}
          currentStepIndex={status?.step === 'Uploading' ? 0 : status?.step === 'Transcribing' ? 1 : 2}
          statusMessage={status?.message || 'Initializing...'}
        />
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: '#0A0A0F' }}>
      <div className="vesper-bg" />
      
      {/* Top Navigation */}
      <div style={{ position: 'absolute', top: '40px', right: '40px', zIndex: 10, display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', padding: '10px 24px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }}>Sign In</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="shimmer-btn" style={{ padding: '12px 28px', fontSize: '12px', height: 'auto' }}>Get Started</button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center' }}>
            <UserButton />
          </div>
        </Show>
      </div>

      <div style={{ margin: 'auto', width: '100%', maxWidth: '900px', padding: '0 20px', textAlign: 'center' }}>
        <div className="animate-up">
          {/* Logo Section */}
          <div style={{ marginBottom: '80px' }}>
            <h1 className="hero-logo" style={{ fontSize: '100px', marginBottom: '24px' }}>
              VES<span>PER</span>
            </h1>
            <p style={{ color: '#A1A1AA', fontSize: '24px', fontWeight: 300, letterSpacing: '0.05em', maxWidth: '700px', margin: '0 auto', lineHeight: 1.4 }}>
              Transform your ministry's long-form sermons into <span style={{ color: '#fff', fontWeight: 500 }}>cinematic short-form media</span> that reaches the next generation.
            </p>
          </div>

          {/* Input Area */}
          <div className="glass-panel" style={{ padding: '64px', background: 'rgba(15, 15, 20, 0.4)' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5em', color: '#8B5CF6', marginBottom: '20px' }}>
                Paste YouTube Sermon Link
              </label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <input 
                  type="text" 
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="glass-input"
                  style={{ flex: 1, height: '72px', fontSize: '18px' }}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <button 
                  onClick={handleProcess}
                  className="shimmer-btn"
                  style={{ padding: '0 48px', height: '72px', fontSize: '14px' }}
                >
                  Process Sermon
                </button>
              </div>
            </div>

            <div className="divider" style={{ margin: '48px 0' }}>or drag and drop video</div>

            {/* Simple Upload Text */}
            <div style={{ cursor: 'pointer', padding: '24px', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', transition: 'all 0.3s' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#666' }}>
                <span style={{ color: '#8B5CF6' }}>Upload MP4 or MOV</span> (Max 2GB)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '64px', marginTop: '80px', opacity: 0.3 }}>
            {['Neural Clipping', 'Cinematic 9:16', 'Dynamic Captions'].map((text, i) => (
              <div key={i} style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em' }}>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
