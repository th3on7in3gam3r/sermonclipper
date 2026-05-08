'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import ProcessingView from '@/components/home/ProcessingView';

const STEPS = [
  { id: 'uploading', label: 'Engine' },
  { id: 'transcribing', label: 'Neural' },
  { id: 'analyzing', label: 'Insight' },
  { id: 'cutting', label: 'Media' },
  { id: 'ready', label: 'Done' },
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
          const title = url.split('v=')[1]?.slice(0, 8) || 'Sermon Suite';
          const newItem = { id: jobId, title, date: new Date().toISOString() };
          const updated = [newItem, ...recentWork.slice(0, 4)];
          setRecentWork(updated);
          localStorage.setItem('sermonclipper_history', JSON.stringify(updated));
          setTimeout(() => router.push(`/results?jobId=${jobId}`), 1000);
        }
        
        if (data.status === 'error') {
          setError(data.message || 'Engine failure.');
          setIsProcessing(false);
          eventSource.close();
        }
      };
      eventSource.onerror = () => eventSource.close();
      return () => eventSource.close();
    }
  }, [jobId, isProcessing, url, recentWork, router]);

  const handleGenerate = async () => {
    if (!url) return setError('URL required.');
    setError('');
    setIsProcessing(true);
    const newJobId = uuidv4();
    setJobId(newJobId);
    setCurrentStepIndex(0);

    try {
      await fetch('/api/download-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, jobId: newJobId }),
      });
    } catch (err: any) {
      setError('Engine initialization failed.');
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white selection:bg-primary/30 flex flex-col items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-xl space-y-8">
        {!isProcessing ? (
          <div className="space-y-10 animate-fade">
            {/* Ultra-Compact Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">
                Sermon<span className="gradient-text">Clipper</span> <span className="text-[10px] opacity-20 ml-1">2.0</span>
              </h1>
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-white/20">Impact Neural Engine</p>
            </div>

            {/* Tight Input Box */}
            <div className="space-y-3">
              <div className="glass border-white/5 p-1 flex gap-1">
                <input
                  type="text"
                  placeholder="Paste YouTube Link"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-white/10"
                />
                <button
                  onClick={handleGenerate}
                  className="bg-primary hover:bg-primary-hover px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  Process
                </button>
              </div>

              {error && (
                <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center animate-fade">
                  Error: {error}
                </div>
              )}
            </div>

            {/* Minimal Project List */}
            {recentWork.length > 0 && (
              <div className="space-y-3 pt-6 border-t border-white/5">
                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/10 text-center">Recent Projects</p>
                <div className="grid grid-cols-1 gap-2">
                  {recentWork.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => router.push(`/results?jobId=${item.id}`)}
                      className="glass !p-3 flex items-center justify-between group hover:border-primary/20 transition-all border-white/5"
                    >
                      <span className="text-[11px] font-bold text-white/40 group-hover:text-white/80 truncate pr-4">{item.title}</span>
                      <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">{new Date(item.date).toLocaleDateString()}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto w-full">
            <ProcessingView
              steps={STEPS}
              currentStepIndex={currentStepIndex}
              statusMessage={statusMessage}
            />
          </div>
        )}
      </div>

      <footer className="fixed bottom-6 w-full text-center">
        <p className="text-[8px] font-black tracking-[0.8em] text-white/5 uppercase select-none">Jerless Mahabir Edition</p>
      </footer>
    </main>
  );
}
