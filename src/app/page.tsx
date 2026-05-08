'use client';

import { useState, useEffect } from 'react';
import ProcessingView from '@/components/home/ProcessingView';
import { useRouter } from 'next/navigation';

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
      await fetch('/api/download-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, jobId: newJobId }),
      });
    } catch (error) {
      console.error('Failed to start job:', error);
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
    <main style={{ minHeight: '100vh', display: 'flex' }}>
      <div className="spiritual-rays" />
      
      <div className="dashboard-container animate-up">
        {/* Logo Section */}
        <div style={{ textAlign: 'center' }}>
          <h1 className="hero-logo">
            SERMON<span>CLIPPER</span>
          </h1>
          <p className="hero-tagline">
            Turn long sermons into powerful short-form content
          </p>
        </div>

        {/* Input Card */}
        <div className="platinum-card">
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#777', marginBottom: '12px' }}>
              YouTube Link
            </label>
            <div className="input-group">
              <input 
                type="text" 
                placeholder="https://www.youtube.com/watch?v=..."
                className="platinum-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button 
                onClick={handleProcess}
                className="platinum-btn"
              >
                Process Sermon
              </button>
            </div>
          </div>

          <div className="divider">or</div>

          {/* Upload Zone */}
          <div className="drop-zone">
            <div className="drop-icon">📤</div>
            <p style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px', letterSpacing: '-0.02em' }}>Upload Video File</p>
            <p style={{ color: '#777', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              MP4, MOV • Max 2GB supported
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#555', marginTop: '40px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em' }}>
          Built for churches • Private & Secure
        </p>
      </div>
    </main>
  );
}
