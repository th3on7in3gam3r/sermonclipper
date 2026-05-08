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
      <main className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center p-6 relative overflow-hidden">
        <div className="spiritual-rays" />
        <ProcessingView 
          steps={[
            { id: 'engine', label: 'Extracting Audio...' },
            { id: 'transcribe', label: 'Transcription...' },
            { id: 'analysis', label: 'Analyzing Moments...' },
            { id: 'visuals', label: 'Generating Clips...' }
          ]}
          currentStepIndex={status?.step === 'Uploading' ? 0 : status?.step === 'Transcribing' ? 1 : 2}
          statusMessage={status?.message || 'Initializing...'}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center p-6 font-inter relative overflow-hidden">
      <div className="spiritual-rays" />
      
      <div className="max-w-xl w-full animate-platinum">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold tracking-tighter mb-2">
            SERMON<span className="text-[#8B5CF6]">CLIPPER</span>
          </h1>
          <p className="text-[#A1A1AA] text-xl font-light">
            Turn long sermons into powerful short-form content
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-[#111114] border border-[#222228] rounded-3xl p-10 shadow-xl space-y-8">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-[#777] mb-3 font-black">YouTube Link</label>
            <div className="flex flex-col md:flex-row gap-3">
              <input 
                type="text" 
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 bg-[#1A1A1F] border border-[#333] focus:border-[#8B5CF6] rounded-2xl px-6 py-4 text-lg outline-none transition-all placeholder:text-white/10"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button 
                onClick={handleProcess}
                className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:brightness-110 px-10 py-4 rounded-2xl font-bold text-sm tracking-widest transition uppercase"
              >
                PROCESS SERMON
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex-1 h-px bg-[#222]"></div>
            <span className="px-6 text-[#555] text-xs font-black uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-[#222]"></div>
          </div>

          {/* Upload Zone */}
          <div className="border-2 border-dashed border-[#444] hover:border-[#8B5CF6] rounded-3xl p-14 text-center transition-all cursor-pointer group bg-black/20">
            <div className="mx-auto w-16 h-16 bg-[#1F1F24] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#8B5CF6]/20 transition-colors">
              <span className="text-2xl">📤</span>
            </div>
            <p className="text-xl font-bold mb-1 tracking-tight">Upload Video File</p>
            <p className="text-[#777] text-[10px] uppercase font-black tracking-widest">MP4, MOV • Max 2GB supported</p>
          </div>
        </div>

        <p className="text-center text-[#555] mt-10 text-[10px] font-black uppercase tracking-[0.4em] select-none">
          Built for churches • Private & Secure
        </p>
      </div>
    </main>
  );
}
