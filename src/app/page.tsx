'use client';

import { useState, useEffect } from 'react';
import ProcessingView from '@/components/home/ProcessingView';
import { useRouter } from 'next/navigation';
import { Show, SignInButton, UserButton } from '@clerk/nextjs';
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
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div className="vesper-bg" />
      
      {/* Top Navigation */}
      <div style={{ position: 'absolute', top: '40px', right: '40px', zIndex: 10 }}>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="platinum-btn" style={{ padding: '12px 32px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>Sign In</button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center' }}>
            <UserButton />
          </div>
        </Show>
      </div>

      <div style={{ margin: 'auto', width: '100%', maxWidth: '800px', padding: '0 20px', textAlign: 'center' }}>
        <div className="animate-up">
          {/* Logo Section */}
          <div style={{ marginBottom: '64px' }}>
            <h1 className="hero-logo">
              VES<span>PER</span>
            </h1>
            <p style={{ color: '#A1A1AA', fontSize: '20px', fontWeight: 300, letterSpacing: '0.1em', maxWidth: '600px', margin: '0 auto' }}>
              Transform long sermons into high-impact, cinematic media kits with the power of AI.
            </p>
          </div>

          {/* Input Card */}
          <div className="glass-panel" style={{ padding: '48px' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: '#8B5CF6', marginBottom: '16px' }}>
                Paste YouTube Sermon URL
              </label>
              <div className="input-group" style={{ display: 'flex', gap: '16px' }}>
                <input 
                  type="text" 
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="glass-input"
                  style={{ flex: 1 }}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <button 
                  onClick={handleProcess}
                  className="shimmer-btn"
                  style={{ padding: '0 40px', height: '64px' }}
                >
                  Harvest Moments
                </button>
              </div>
            </div>

            <div className="divider">or drag and drop</div>

            {/* Upload Zone */}
            <div className="drop-zone" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <div className="drop-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>📤</div>
              <p style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>Upload Sermon Binary</p>
              <p style={{ color: '#555', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em' }}>
                MP4, MOV, WAV • Up to 2GB Supported
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginTop: '64px', opacity: 0.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              <span style={{ color: '#8B5CF6' }}>●</span> Neural Clipping
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              <span style={{ color: '#8B5CF6' }}>●</span> Cinematic Cropping
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              <span style={{ color: '#8B5CF6' }}>●</span> Dynamic Captions
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
