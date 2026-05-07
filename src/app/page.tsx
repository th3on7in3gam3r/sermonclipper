'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import BrandingModal from '@/components/home/BrandingModal';
import ProcessingView from '@/components/home/ProcessingView';

const STEPS = [
  { id: 'uploading', label: 'Uploading' },
  { id: 'transcribing', label: 'Transcribing' },
  { id: 'analyzing', label: 'Analyzing' },
  { id: 'cutting', label: 'Cutting' },
  { id: 'ready', label: 'Ready' },
];

const MAX_UPLOAD_BYTES = 24 * 1024 * 1024; // 24 MB
const MAX_TRANSCRIPT_BYTES = 24 * 1024 * 1024; // 24 MB

function getByteSize(text: string) {
  return new TextEncoder().encode(text).length;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [branding, setBranding] = useState({
    template: 'Modern Cinematic',
    primaryColor: '#8b5cf6',
    accentColor: '#d946ef',
    logoDescription: '',
    fonts: 'Outfit for headings, Inter for body'
  });
  const [showBranding, setShowBranding] = useState(false);
  const [recentWork, setRecentWork] = useState<{ id: string; title: string; date: string }[]>([]);
  const [jobId, setJobId] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [statusMessage, setStatusMessage] = useState('');
  const [longSermonWarning, setLongSermonWarning] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Load recent work from local storage
    const saved = localStorage.getItem('vesper_recent_work');
    if (saved) {
      Promise.resolve().then(() => setRecentWork(JSON.parse(saved)));
    }
  }, []);

  const saveToHistory = (id: string, title: string) => {
    const newItem = { id, title, date: new Date().toISOString() };
    const updated = [newItem, ...recentWork.slice(0, 4)];
    setRecentWork(updated);
    localStorage.setItem('vesper_recent_work', JSON.stringify(updated));
  };

  useEffect(() => {
    if (jobId && isProcessing) {
      const eventSource = new EventSource(`/api/progress?id=${jobId}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('[Progress] Incoming:', data);
        const stepIndex = STEPS.findIndex(s => s.id === data.step.toLowerCase());
        if (stepIndex !== -1) {
          setCurrentStepIndex(stepIndex);
        }
        setStatusMessage(data.message || '');
        if (data.status === 'completed' && data.step.toLowerCase() === 'cutting') {
          setCurrentStepIndex(4); // Mark "Ready"
          saveToHistory(jobId, url || file?.name || 'Sermon Suite');
        }
        if (data.status === 'error') {
          setError(data.message || 'An error occurred');
          setIsProcessing(false);
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
      };

      return () => eventSource.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, isProcessing]);

  const handleGenerate = async () => {
    if (!url && !file) {
      setError('Please provide a YouTube URL or upload a video file.');
      return;
    }

    setError('');
    setLongSermonWarning('');
    setIsProcessing(true);
    const newJobId = uuidv4();
    setJobId(newJobId);
    setCurrentStepIndex(0);

    try {
      let filePath = '';
      let transcriptionData = null;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('jobId', newJobId);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        filePath = data.filePath;
      } else {
        const res = await fetch('/api/download-youtube', {
          method: 'POST',
          body: JSON.stringify({ url, jobId: newJobId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        filePath = data.filePath;
      }

      if (transcript && transcript.trim()) {
        const transcriptBytes = getByteSize(transcript);
        if (transcriptBytes > MAX_TRANSCRIPT_BYTES) {
          throw new Error('Custom transcript is too large for server processing. Please shorten it or use a shorter sermon.');
        }
        transcriptionData = { transcription: { text: transcript } };
        setCurrentStepIndex(1);
      } else {
        const transcribeRes = await fetch('/api/transcribe', {
          method: 'POST',
          body: JSON.stringify({ filePath, jobId: newJobId }),
        });
        transcriptionData = await transcribeRes.json();
        if (!transcribeRes.ok) throw new Error(transcriptionData.error);

        const transcriptText = transcriptionData.transcription?.text || '';
        const transcriptBytes = getByteSize(transcriptText);
        if (transcriptBytes > MAX_TRANSCRIPT_BYTES) {
          throw new Error('Transcript output is too large for analysis. Please use a shorter sermon or provide a shorter transcript.');
        }
        
        if (transcriptionData.longSermonMode) {
          setLongSermonWarning(`Long sermon mode enabled — ${Math.ceil(transcriptionData.durationSeconds / 60)} minutes detected. Processing may take significantly longer.`);
        }
      }

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ 
          transcription: transcriptionData.transcription, 
          jobId: newJobId,
          branding: branding
        }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeData.error);

      const processRes = await fetch('/api/process-clips', {
        method: 'POST',
        body: JSON.stringify({
          filePath,
          clips: analyzeData.clips,
          social_captions: analyzeData.social_captions,
          summaries: analyzeData.summaries,
          five_day_devotional: analyzeData.five_day_devotional,
          sermon_images: analyzeData.sermon_images,
          quotes_and_verses: analyzeData.quotes_and_verses,
          transcription: transcriptionData.transcription,
          jobId: newJobId,
        }),
      });
      const processData = await processRes.json();
      if (!processRes.ok) throw new Error(processData.error);

      setCurrentStepIndex(4);
      router.push(`/results?jobId=${newJobId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      setIsProcessing(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-black overflow-hidden font-sans max-w-full selection:bg-violet-500/30 selection:text-violet-200">
      {/* Cinematic Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-8%] left-[-8%] w-[45%] h-[45%] bg-violet-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-8%] right-[-8%] w-[45%] h-[45%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[18%] right-[10%] w-[28%] h-[28%] bg-fuchsia-600/10 rounded-full blur-[100px] animate-bounce" style={{ animationDuration: '10s' }} />
        <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 flex flex-col items-center justify-center min-h-screen">
        <div className="w-full space-y-10">
          
          {/* Hero Section */}
          <header className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-black uppercase tracking-[0.2em] mb-4 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              Next-Gen Sermon AI
            </div>
            <div className="space-y-2">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-tight uppercase">
                <span className="font-extralight tracking-widest opacity-40">VES</span>PER
              </h1>
              <div className="h-1 w-24 bg-gradient-to-r from-violet-500 to-transparent mx-auto rounded-full" />
            </div>
            <p className="max-w-xl mx-auto text-zinc-500 text-sm sm:text-base font-black uppercase tracking-[0.35em] leading-relaxed">
              Capturing the <span className="text-white">Heart</span> of every message.
            </p>
          </header>

          {!isProcessing ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Column: Recent History */}
              <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-1 h-4 bg-violet-500 rounded-full" />
                  <h3 className="text-sm font-black uppercase tracking-[0.28em] text-zinc-500">Recent Missions</h3>
                </div>
                
                <div className="space-y-3">
                  {recentWork.length > 0 ? (
                    recentWork.map((work) => (
                      <button
                        key={work.id}
                        onClick={() => router.push(`/results?jobId=${work.id}`)}
                        className="w-full text-left p-4 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-violet-500/50 hover:bg-zinc-900/60 transition-all group"
                      >
                        <p className="text-sm font-bold text-zinc-300 truncate group-hover:text-violet-400 transition-colors">
                          {work.title}
                        </p>
                        <p className="text-sm text-zinc-600 font-bold uppercase mt-1">
                          {new Date(work.date).toLocaleDateString()}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 rounded-2xl border border-dashed border-zinc-800 flex flex-col items-center justify-center text-center">
                      <p className="text-sm font-black uppercase tracking-widest text-zinc-700">No History Yet</p>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-zinc-900">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/5 to-transparent border border-violet-500/10">
                    <p className="text-sm font-black uppercase tracking-widest text-violet-400 mb-2">Studio Profile</p>
                    <p className="text-sm font-bold text-zinc-400">{branding.template}</p>
                    <div className="flex gap-2 mt-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: branding.primaryColor }} />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: branding.accentColor }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Column: Action Center */}
              <div className="lg:col-span-3 space-y-8 order-1 lg:order-2">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000" />
                  
                  <div className="relative glass-card-premium p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-3xl">
                    <div className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        
                        {/* Option 1: File Upload */}
                        <div className="space-y-4">
                          <label className="text-sm font-black uppercase tracking-[0.28em] text-zinc-500 flex items-center gap-2">
                            <div className="w-4 h-[1px] bg-zinc-800" /> Upload Source
                          </label>
                          <div 
                            className={`group relative h-64 sm:h-56 rounded-3xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-4 ${
                              file 
                              ? 'border-violet-500 bg-violet-500/5' 
                              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/20 hover:bg-zinc-900/40'
                            }`}
                            onClick={() => document.getElementById('file-upload')?.click()}
                          >
                            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 group-hover:scale-110 transition-transform">
                              <svg className={`w-6 h-6 ${file ? 'text-violet-400' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <div className="text-center px-4">
                              <p className={`font-bold text-sm truncate max-w-[200px] ${file ? 'text-violet-400' : 'text-zinc-400'}`}>
                                {file ? file.name : 'Drop Video File'}
                              </p>
                              <p className="text-sm text-zinc-600 font-bold uppercase mt-1">MP4, MOV up to 24MB</p>
                              <p className="text-xs text-amber-400/80 mt-1">⚠️ Long sermons (45min+) require manual splitting</p>
                            </div>
                            <input 
                              id="file-upload"
                              type="file" 
                              className="hidden" 
                              accept="video/*"
                              onChange={(e) => {
                                const selected = e.target.files?.[0] || null;
                                if (selected && selected.size > MAX_UPLOAD_BYTES) {
                                  setError('Selected video exceeds the 24MB upload limit. For long sermons, use a YouTube URL or a smaller file.');
                                  setFile(null);
                                  return;
                                }
                                setError('');
                                setFile(selected);
                              }}
                            />
                          </div>
                        </div>

                        {/* Option 2: YouTube */}
                        <div className="space-y-4">
                          <label className="text-sm font-black uppercase tracking-[0.28em] text-zinc-500 flex items-center gap-2">
                            <div className="w-4 h-[1px] bg-zinc-800" /> YouTube Link
                          </label>
                          <div className="space-y-4">
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-zinc-600 group-focus-within:text-violet-500 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z" />
                                </svg>
                              </div>
                              <input
                                type="text"
                                placeholder="Paste sermon URL..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full pl-14 pr-6 py-5 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 focus:border-violet-500 focus:bg-violet-500/5 outline-none transition-all placeholder:text-zinc-700 font-bold text-sm"
                              />
                            </div>
                            
                            <div className="space-y-3">
                              <label className="text-sm font-black uppercase tracking-[0.28em] text-violet-500/60">
                                Custom Transcript (Optional)
                              </label>
                              <textarea
                                placeholder="Paste transcript for perfect accuracy..."
                                value={transcript}
                                onChange={(e) => setTranscript(e.target.value)}
                                rows={3}
                                className="w-full p-5 bg-zinc-900/30 rounded-2xl border border-zinc-800/30 focus:border-violet-500/30 outline-none transition-all placeholder:text-zinc-800 text-sm font-medium resize-none font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-black animate-shake text-center uppercase tracking-widest">
                          {error}
                        </div>
                      )}

                      <div className="flex flex-col md:flex-row gap-4 pt-4">
                        <button
                          onClick={() => setShowBranding(true)}
                          className="flex-1 min-h-[44px] py-5 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-400 font-black rounded-3xl transition-all flex items-center justify-center gap-3 uppercase text-sm tracking-[0.1em] border border-white/5 hover:border-violet-500/50"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                          Branding Studio
                        </button>
                        <button
                          onClick={handleGenerate}
                          className="flex-[2] min-h-[44px] py-5 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-3xl transition-all flex items-center justify-center gap-3 uppercase text-sm tracking-[0.1em] shadow-[0_20px_50px_rgba(139,92,246,0.3)] active:scale-[0.98]"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Create Media Kit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative group max-w-2xl mx-auto w-full">
               <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 to-emerald-600/20 rounded-[2.5rem] blur opacity-50" />
               <div className="relative glass-card-premium p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-3xl">
                {longSermonWarning && (
            <div className="mb-6 rounded-3xl border border-amber-400/20 bg-amber-500/5 p-4 text-amber-100 text-sm font-bold uppercase tracking-[0.16em]">
              {longSermonWarning}
            </div>
          )}
          <ProcessingView 
                  steps={STEPS} 
                  currentStepIndex={currentStepIndex} 
                  statusMessage={statusMessage} 
                />
               </div>
            </div>
          )}
        </div>
      </div>

      {showBranding && (
        <BrandingModal 
          branding={branding} 
          setBranding={setBranding} 
          onClose={() => setShowBranding(false)} 
        />
      )}
    </main>
  );
}
