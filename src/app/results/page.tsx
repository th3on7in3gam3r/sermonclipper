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
    <div className="max-w-6xl w-full animate-platinum">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none text-white">
            Sermon <span className="text-[#8B5CF6]">Results</span>
          </h1>
          <p className="text-[#A1A1AA] text-lg font-light tracking-tight mt-2">Neural harvesting complete. Clips are ready for social.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button 
            onClick={handleCopy}
            className="flex-1 md:flex-none px-8 py-4 rounded-2xl bg-white/5 border border-[#222] font-bold text-[10px] uppercase tracking-widest transition hover:bg-white/10"
          >
            {copied ? 'Copied Link' : 'Copy Session Link'}
          </button>
          <a 
            href={videoUrl || '#'} 
            download
            className="flex-1 md:flex-none px-8 py-4 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] font-bold text-[10px] uppercase tracking-widest text-white text-center shadow-lg shadow-[#8B5CF6]/20 transition hover:brightness-110"
          >
            Download Master
          </a>
        </div>
      </div>

      {/* Clips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Main Session Clip */}
        <div className="bg-[#111114] border border-[#222] rounded-3xl overflow-hidden shadow-2xl group transition hover:border-[#8B5CF6]/50">
          <div className="aspect-video bg-black relative">
            {videoUrl ? (
              <video className="w-full h-full object-cover" src={videoUrl} controls></video>
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-10">
                <p className="text-xs uppercase font-black tracking-widest">Feed Loading...</p>
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border border-white/10">Full Session</div>
          </div>
          <div className="p-6 space-y-4">
            <h3 className="font-bold text-lg tracking-tight line-clamp-2">Master Sermon Session</h3>
            <p className="text-white/20 text-xs leading-relaxed">High-resolution session capture. Perfect for full-length archiving.</p>
            <button disabled className="w-full bg-[#8B5CF6]/10 text-[#8B5CF6] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-50">
              Master Stream Online
            </button>
          </div>
        </div>

        {/* Social Clip Placeholders */}
        {[1, 2].map((i) => (
          <div key={i} className="bg-[#111114] border border-[#222] rounded-3xl overflow-hidden shadow-2xl opacity-60">
            <div className="aspect-[9/16] bg-black/40 relative flex items-center justify-center border-b border-white/5">
              <div className="text-center space-y-2">
                <span className="text-2xl opacity-20">🎬</span>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/10">AI Harvesting {i}...</p>
              </div>
              <div className="absolute top-4 right-4"><div className="w-2 h-2 rounded-full bg-[#F4B942] animate-pulse" /></div>
            </div>
            <div className="p-6">
              <div className="h-4 w-3/4 bg-white/5 rounded-lg mb-3 animate-pulse" />
              <div className="h-4 w-1/2 bg-white/5 rounded-lg mb-6 animate-pulse opacity-50" />
              <button disabled className="w-full bg-white/5 text-white/10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                Processing Social Pack
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-[#555] text-[10px] font-black uppercase tracking-[0.4em] mt-24">
        Professional Suite · Ironclad Build 2.8
      </p>
    </div>
  );
}

export default function Results() {
  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white p-8 md:p-16 flex justify-center relative overflow-hidden">
      <div className="spiritual-rays" />
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-screen space-y-6">
          <div className="w-12 h-12 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 animate-pulse">Synchronizing Neural Dashboard...</p>
        </div>
      }>
        <ResultsContent />
      </Suspense>
    </main>
  );
}
