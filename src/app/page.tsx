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
      <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        <div className="spiritual-rays" />
        <div className="spiritual-motif" />
        <ProcessingView 
          steps={[
            { id: 'engine', label: 'Neural Connection' },
            { id: 'analysis', label: 'Spiritual Analysis' },
            { id: 'extraction', label: 'Clip Extraction' }
          ]}
          currentStepIndex={0}
          statusMessage={status?.message || 'Waking Engine...'}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="spiritual-rays" />
      <div className="spiritual-motif" />

      <div className="w-full max-w-xl space-y-16 animate-platinum text-center">
        {/* Platinum Branding */}
        <div className="space-y-4">
          <h1 className="text-6xl font-black tracking-tighter uppercase leading-none text-white">
            SERMON<span className="gradient-text">CLIPPER</span>
          </h1>
          <p className="text-sm font-bold uppercase tracking-[0.5em] text-white/40">
            Turn long sermons into powerful short-form content
          </p>
        </div>

        {/* Input Section */}
        <div className="platinum-card space-y-8 purple-glow">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Paste YouTube Link"
              className="input-platinum"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button 
              onClick={handleProcess}
              className="btn-platinum w-full text-lg"
            >
              Process Sermon
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
            <div className="relative flex justify-center"><span className="bg-[#121212] px-4 text-[10px] font-black text-white/20 uppercase tracking-widest">or</span></div>
          </div>

          {/* Drag & Drop Area */}
          <div className="border-2 border-dashed border-white/5 rounded-2xl p-12 text-center hover:border-white/10 transition-colors group cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
              <svg className="w-6 h-6 text-white/20 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Drag & drop video upload</p>
            <p className="text-[10px] text-white/10 mt-1">Upload video file directly</p>
          </div>
        </div>

        {/* Spiritual Footer */}
        <div className="pt-12">
          <p className="text-[9px] font-black tracking-[0.8em] text-white/5 uppercase select-none">
            Empowering Ministry Through AI
          </p>
        </div>
      </div>
    </main>
  );
}
