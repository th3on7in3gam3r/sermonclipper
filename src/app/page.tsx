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

const MAX_UPLOAD_BYTES = 24 * 1024 * 1024;
const MAX_TRANSCRIPT_BYTES = 24 * 1024 * 1024;

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
    primaryColor: '#4f46e5',
    accentColor: '#8b5cf6',
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
        const stepIndex = STEPS.findIndex(s => s.id === data.step.toLowerCase());
        if (stepIndex !== -1) setCurrentStepIndex(stepIndex);
        setStatusMessage(data.message || '');
        if (data.status === 'completed' && data.step.toLowerCase() === 'cutting') {
          setCurrentStepIndex(4);
          saveToHistory(jobId, url || file?.name || 'Sermon Suite');
        }
        if (data.status === 'error') {
          setError(data.message || 'An error occurred');
          setIsProcessing(false);
          eventSource.close();
        }
      };
      eventSource.onerror = () => eventSource.close();
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
        
        // The download is now backgrounded. We must wait for it to complete.
        filePath = await new Promise<string>((resolve, reject) => {
          const es = new EventSource(`/api/progress?id=${newJobId}`);
          es.onmessage = (event) => {
            const progress = JSON.parse(event.data);
            if (progress.status === 'completed' && progress.step.toLowerCase() === 'uploading') {
              es.close();
              if (progress.filePath) resolve(progress.filePath);
              else reject(new Error('Download completed but no file path was provided.'));
            } else if (progress.status === 'error') {
              es.close();
              reject(new Error(progress.message || 'Download failed in background.'));
            }
          };
          es.onerror = () => {
            es.close();
            reject(new Error('Progress connection lost during download.'));
          };
        });
      }

      if (transcript && transcript.trim()) {
        if (getByteSize(transcript) > MAX_TRANSCRIPT_BYTES) {
          throw new Error('Custom transcript is too large. Please shorten it.');
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
        if (getByteSize(transcriptionData.transcription?.text || '') > MAX_TRANSCRIPT_BYTES) {
          throw new Error('Transcript is too large. Please use a shorter sermon.');
        }
        if (transcriptionData.longSermonMode) {
          setLongSermonWarning(`Long sermon detected — ${Math.ceil(transcriptionData.durationSeconds / 60)} min. Processing may take longer.`);
        }
      }

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ transcription: transcriptionData.transcription, jobId: newJobId, branding }),
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
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsProcessing(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#fdfcf8] overflow-hidden font-sans">
      {/* Warm ambient background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-indigo-100/60 via-violet-50/40 to-transparent rounded-full blur-[80px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-gradient-to-tl from-amber-50/60 to-transparent blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col items-center justify-center min-h-screen">
        <div className="w-full space-y-12">

          {/* Hero */}
          <header className="text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold uppercase tracking-widest animate-fade-in">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500" />
              </span>
              AI-Powered Sermon Media
            </div>

            <div>
              <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-none">
                <span className="text-stone-400 select-none">VES</span><span className="gradient-text">PER</span>
              </h1>
              <div className="h-px w-20 bg-gradient-to-r from-indigo-400 to-violet-400 mx-auto mt-3 rounded-full" />
            </div>

            <p className="max-w-md mx-auto text-stone-500 text-sm font-medium tracking-wide leading-relaxed">
              Transform your sermon into a complete social media kit — clips, art, quotes & devotionals.
            </p>
          </header>

          {!isProcessing ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

              {/* Sidebar: Recent + Profile */}
              <aside className="lg:col-span-1 space-y-4 order-2 lg:order-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 px-1">Recent</p>
                <div className="space-y-2">
                  {recentWork.length > 0 ? recentWork.map((work) => (
                    <button
                      key={work.id}
                      onClick={() => router.push(`/results?jobId=${work.id}`)}
                      className="w-full text-left p-3.5 rounded-xl bg-white border border-stone-200 hover:border-indigo-300 hover:shadow-sm transition-all group"
                    >
                      <p className="text-sm font-semibold text-stone-700 truncate group-hover:text-indigo-600 transition-colors">
                        {work.title}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {new Date(work.date).toLocaleDateString()}
                      </p>
                    </button>
                  )) : (
                    <div className="p-6 rounded-xl border border-dashed border-stone-200 text-center">
                      <p className="text-xs text-stone-400 font-medium">No history yet</p>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Studio Profile</p>
                  <p className="text-sm font-medium text-stone-600">{branding.template}</p>
                  <div className="flex gap-2 mt-1">
                    <div className="w-4 h-4 rounded-full ring-1 ring-stone-200" style={{ backgroundColor: branding.primaryColor }} />
                    <div className="w-4 h-4 rounded-full ring-1 ring-stone-200" style={{ backgroundColor: branding.accentColor }} />
                  </div>
                </div>
              </aside>

              {/* Main card */}
              <div className="lg:col-span-3 order-1 lg:order-2">
                <div className="card-raised p-8 md:p-10 rounded-2xl">
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                      {/* Upload */}
                      <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-widest text-stone-400">
                          Upload Video
                        </label>
                        <div
                          onClick={() => document.getElementById('file-upload')?.click()}
                          className={`relative h-48 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-3 transition-all ${
                            file
                              ? 'border-indigo-400 bg-indigo-50/60'
                              : 'border-stone-200 hover:border-indigo-300 hover:bg-indigo-50/30 bg-stone-50/50'
                          }`}
                        >
                          <div className={`p-3 rounded-xl ${file ? 'bg-indigo-100' : 'bg-white border border-stone-200'}`}>
                            <svg className={`w-5 h-5 ${file ? 'text-indigo-500' : 'text-stone-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <div className="text-center px-4">
                            <p className={`text-sm font-semibold truncate max-w-[180px] ${file ? 'text-indigo-600' : 'text-stone-500'}`}>
                              {file ? file.name : 'Drop video file here'}
                            </p>
                            <p className="text-xs text-stone-400 mt-0.5">MP4, MOV · up to 24 MB</p>
                            <p className="text-xs text-amber-500 mt-1">⚠ 45 min+ sermons need splitting</p>
                          </div>
                          <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            accept="video/*"
                            onChange={(e) => {
                              const selected = e.target.files?.[0] || null;
                              if (selected && selected.size > MAX_UPLOAD_BYTES) {
                                setError('File exceeds 24 MB. Use a YouTube URL or smaller file.');
                                setFile(null);
                                return;
                              }
                              setError('');
                              setFile(selected);
                            }}
                          />
                        </div>
                      </div>

                      {/* YouTube + Transcript */}
                      <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-widest text-stone-400">
                          YouTube Link
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-stone-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            placeholder="Paste YouTube URL..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-sm text-stone-700 placeholder:text-stone-300 font-medium"
                          />
                        </div>

                        <div className="space-y-2 pt-1">
                          <label className="text-xs font-semibold uppercase tracking-widest text-stone-400">
                            Custom Transcript <span className="normal-case font-normal text-stone-300">(optional)</span>
                          </label>
                          <textarea
                            placeholder="Paste transcript for better accuracy..."
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            rows={4}
                            className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-sm text-stone-700 placeholder:text-stone-300 resize-none font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium animate-shake text-center">
                        {error}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={() => setShowBranding(true)}
                        className="flex-1 py-3.5 bg-white border border-stone-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-stone-600 hover:text-indigo-600 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        Branding Studio
                      </button>
                      <button
                        onClick={handleGenerate}
                        className="flex-[2] py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-200 active:scale-[0.98]"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate Media Kit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto w-full">
              <div className="card-raised p-8 md:p-12 rounded-2xl">
                {longSermonWarning && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-medium">
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
