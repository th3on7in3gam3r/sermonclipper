'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import ProcessingView from '@/components/home/ProcessingView';

const STEPS = [
  { id: 'uploading', label: 'Resolving' },
  { id: 'transcribing', label: 'Transcribing' },
  { id: 'analyzing', label: 'Analyzing' },
  { id: 'cutting', label: 'Polishing' },
  { id: 'ready', label: 'Complete' },
];

export default function Home() {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobId, setJobId] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [recentWork, setRecentWork] = useState<{ id: string; title: string; date: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('sermonclipper_history');
    if (saved) setRecentWork(JSON.parse(saved));
  }, []);

  const saveToHistory = (id: string, title: string) => {
    const newItem = { id, title, date: new Date().toISOString() };
    const updated = [newItem, ...recentWork.slice(0, 5)];
    setRecentWork(updated);
    localStorage.setItem('sermonclipper_history', JSON.stringify(updated));
  };

  useEffect(() => {
    if (jobId && isProcessing) {
      const eventSource = new EventSource(`/api/progress?id=${jobId}`);
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const stepIndex = STEPS.findIndex(s => s.id === data.step.toLowerCase());
        if (stepIndex !== -1) setCurrentStepIndex(stepIndex);
        setStatusMessage(data.message || '');
        
        if (data.status === 'completed' && data.step.toLowerCase() === 'cutting') {
          setCurrentStepIndex(4);
          saveToHistory(jobId, url || 'Sermon Suite');
          setTimeout(() => router.push(`/results?jobId=${jobId}`), 1500);
        }
        
        if (data.status === 'error') {
          setError(data.message || 'The engine encountered a roadblock.');
          setIsProcessing(false);
          eventSource.close();
        }
      };
      eventSource.onerror = () => eventSource.close();
      return () => eventSource.close();
    }
  }, [jobId, isProcessing, url, recentWork, router]);

  const handleGenerate = async () => {
    if (!url) return setError('Please provide a YouTube URL.');
    setError('');
    setIsProcessing(true);
    const newJobId = uuidv4();
    setJobId(newJobId);
    setCurrentStepIndex(0);

    try {
      const res = await fetch('/api/download-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, jobId: newJobId }),
      });
      if (!res.ok) throw new Error('Download stage failed to initialize.');
    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Refined Background */}
      <div className="fixed inset-0 bg-[#0A0A0A] -z-20" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.05),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,0.03),transparent_40%)] -z-10" />

      <div className="w-full max-w-3xl space-y-10">
        {!isProcessing ? (
          <div className="space-y-12 animate-fade">
            {/* Minimalist Hero */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">SermonClipper 2.0</span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
                Transform Sermons <br />
                <span className="gradient-text">Into Impact.</span>
              </h1>
              <p className="text-base text-white/30 max-w-xl mx-auto font-medium leading-relaxed">
                Paste a YouTube URL and let our neural engine generate high-end clips and social content in minutes.
              </p>
            </div>

            {/* Refined Input Area */}
            <div className="space-y-4">
              <div className="glass-card !p-1.5 flex flex-col sm:flex-row gap-2 shadow-2xl">
                <input
                  type="text"
                  placeholder="Paste YouTube link here..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 bg-transparent px-5 py-4 text-white placeholder:text-white/10 outline-none font-medium"
                />
                <button
                  onClick={handleGenerate}
                  className="btn-primary !px-8 !py-4 shadow-indigo-500/20"
                >
                  Generate
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="p-4 glass !border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-3 animate-fade justify-center">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}
                </div>
              )}
            </div>

            {/* Minimalist History */}
            {recentWork.length > 0 && (
              <div className="pt-8 border-t border-white/5 space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20 text-center">Recent Projects</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recentWork.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => router.push(`/results?jobId=${item.id}`)}
                      className="glass !p-4 text-left hover:bg-white/5 transition-all group flex items-center justify-between border-white/5"
                    >
                      <div className="truncate pr-4">
                        <div className="text-xs font-bold truncate text-white/60 group-hover:text-primary transition-colors">{item.title}</div>
                        <div className="text-[9px] text-white/20 font-bold uppercase tracking-tighter mt-1">{new Date(item.date).toLocaleDateString()}</div>
                      </div>
                      <svg className="w-3 h-3 text-white/10 group-hover:text-primary transition-all transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <ProcessingView
            steps={STEPS}
            currentStepIndex={currentStepIndex}
            statusMessage={statusMessage}
          />
        )}
      </div>

      <footer className="mt-auto py-8">
        <p className="text-[9px] font-black tracking-[0.4em] text-white/5 uppercase">Jerless Mahabir Edition</p>
      </footer>
    </main>
  );
}
