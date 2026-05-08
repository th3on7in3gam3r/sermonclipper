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
          // Wait a beat for the completion animation
          setTimeout(() => router.push(`/suite/${jobId}`), 1500);
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
    <main className="min-h-screen relative flex flex-col items-center justify-center p-6 sm:p-24 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-4xl z-10 space-y-12">
        {!isProcessing ? (
          <div className="space-y-16 animate-fade">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400 mb-4">
                SermonClipper 2.0
              </div>
              <h1 className="text-6xl sm:text-8xl font-extrabold tracking-tighter leading-none">
                Transform Sermons <br />
                <span className="gradient-text">Into Impact.</span>
              </h1>
              <p className="text-xl text-white/40 max-w-2xl mx-auto font-medium leading-relaxed">
                Paste a YouTube URL and let our AI engine generate high-end clips, transcripts, and social content in minutes.
              </p>
            </div>

            {/* Input Section */}
            <div className="glass-card max-w-3xl mx-auto p-1.5 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 bg-transparent px-6 py-4 text-lg outline-none placeholder:text-white/20 font-medium"
              />
              <button
                onClick={handleGenerate}
                className="btn-primary whitespace-nowrap"
              >
                Generate Suite
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="max-w-xl mx-auto p-4 glass border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-3 animate-fade">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            {/* History Section */}
            {recentWork.length > 0 && (
              <div className="max-w-2xl mx-auto pt-12 border-t border-white/5 space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/20 text-center">Recent Generations</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentWork.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => router.push(`/suite/${item.id}`)}
                      className="glass p-4 text-left hover:bg-white/10 transition-all group flex items-center justify-between"
                    >
                      <div className="truncate pr-4">
                        <div className="text-sm font-bold truncate text-white/80 group-hover:text-primary transition-colors">{item.title}</div>
                        <div className="text-[10px] text-white/20 font-medium uppercase tracking-tighter mt-1">{new Date(item.date).toLocaleDateString()}</div>
                      </div>
                      <svg className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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

      <footer className="absolute bottom-8 text-[10px] font-bold uppercase tracking-[0.5em] text-white/10">
        Jerless Mahabir Edition
      </footer>
    </main>
  );
}
