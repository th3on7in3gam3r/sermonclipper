'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

function ResultsContent() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get('videoUrl');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (videoUrl) {
      navigator.clipboard.writeText(videoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-12 animate-platinum">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black tracking-tighter uppercase leading-none text-white">
          Media <span className="gradient-text">Ready</span>
        </h1>
        <p className="text-xs font-bold uppercase tracking-[0.5em] text-white/40">Your sermon clips have been harvested</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Main Video Card */}
        <div className="platinum-card purple-glow space-y-6 md:col-span-2">
          <div className="aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/5 relative group">
            {videoUrl ? (
              <video src={videoUrl} controls className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/10">Neural Feed Unavailable</p>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Full Session Clip</h3>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">Master Video · High Resolution</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={handleCopy}
                className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                {copied ? 'Copied Link' : 'Copy Link'}
              </button>
              <a 
                href={videoUrl || '#'} 
                download
                className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-accent text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all text-center"
              >
                Download File
              </a>
            </div>
          </div>
        </div>

        {/* Social Clips Placeholder */}
        {[1, 2].map((i) => (
          <div key={i} className="platinum-card gold-glow space-y-4">
            <div className="aspect-[9/16] bg-black/40 rounded-xl border border-white/5 flex items-center justify-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/10">AI Clip {i} Pending</p>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-3/4 bg-white/5 rounded-full" />
              <div className="h-2 w-1/2 bg-white/5 rounded-full opacity-50" />
            </div>
            <button disabled className="w-full py-3 rounded-xl bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/20">
              Processing Social Pack
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="pt-24 border-t border-white/5 text-center opacity-10">
        <p className="text-[8px] font-black tracking-[0.8em] uppercase">Professional Suite · Ironclad Build 2.7</p>
      </footer>
    </div>
  );
}

export default function Results() {
  return (
    <main className="min-h-screen flex flex-col items-center p-6 py-12 relative overflow-hidden">
      <div className="spiritual-rays" />
      <div className="spiritual-motif" />
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 animate-pulse">Synchronizing Neural Data...</p>
        </div>
      }>
        <ResultsContent />
      </Suspense>
    </main>
  );
}
