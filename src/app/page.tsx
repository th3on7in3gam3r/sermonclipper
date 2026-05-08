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
      
      const timeoutId = setTimeout(() => {
        if (currentStepIndex === -1) {
          setError('Handshake Timeout. Engine is not responding.');
          setIsProcessing(false);
          eventSource.close();
        }
      }, 15000);

      eventSource.onmessage = (event) => {
        clearTimeout(timeoutId);
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
      
      eventSource.onerror = () => {
        setError('Lost connection to Neural Engine. (Server might be rebooting or timing out)');
        setIsProcessing(false);
        eventSource.close();
      };
      
      return () => {
        clearTimeout(timeoutId);
        eventSource.close();
      };
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
      const res = await fetch('/api/download-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, jobId: newJobId }),
      });
      if (!res.ok) throw new Error('API Rejection');
    } catch (err: any) {
      setError('Engine initialization failed.');
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl animate-fade">
        {!isProcessing ? (
          <div className="compact-stack">
            <div className="text-center" style={{ marginBottom: '1rem' }}>
              <h1 className="text-3xl font-black tracking-tighter uppercase leading-tight mb-2">
                Sermon<span className="gradient-text">Clipper</span> <span className="text-[10px] opacity-20">2.3</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20">Impact Neural Engine</p>
            </div>

            <div className="compact-stack-small">
              <div className="glass flex items-center">
                <input
                  type="text"
                  placeholder="Paste YouTube Link"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="input-glass"
                />
                <button onClick={handleGenerate} className="btn-primary" style={{ margin: '0.25rem' }}>
                  Process
                </button>
              </div>
              {error && (
                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest text-center">{error}</p>
              )}
            </div>

            {recentWork.length > 0 && (
              <div className="compact-stack-small pt-8 border-t border-white/5">
                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/10 text-center mb-2">Recent Projects</p>
                {recentWork.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => router.push(`/results?jobId=${item.id}`)}
                    className="glass flex items-center justify-between p-3 hover:bg-white/5 transition-all"
                    style={{ padding: '0.75rem 1rem' }}
                  >
                    <span className="text-[11px] font-bold text-white/40 truncate">{item.title}</span>
                    <span className="text-[9px] font-black text-white/10 uppercase">{new Date(item.date).toLocaleDateString()}</span>
                  </button>
                ))}
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

      <footer className="fixed bottom-6 w-full text-center">
        <p className="text-[8px] font-black tracking-[0.8em] text-white/5 uppercase">Professional Edition</p>
      </footer>
    </main>
  );
}
