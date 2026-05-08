'use client';

import { useState } from 'react';

interface SermonImage {
  title: string;
  description: string;
  full_image_prompt: string;
}

function SermonArtCard({ asset }: { asset: SermonImage }) {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const handleGenerate = async () => {
    if (!asset.full_image_prompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt: asset.full_image_prompt }),
      });
      const data = await res.json();
      if (data.success) setGeneratedImage(data.imageUrl);
      else console.error(data.error);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="glass-card !p-0 flex flex-col overflow-hidden border-white/5 hover:border-accent/30 transition-all duration-500">
      {/* Content Header */}
      <div className="p-6 space-y-2 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Sermon Art</span>
        </div>
        <h3 className="font-bold text-white text-sm leading-tight line-clamp-2">{asset.title}</h3>
      </div>

      {/* Image / Placeholder Area */}
      <div className="aspect-[9/16] relative group">
        {generatedImage ? (
          <>
            <img src={generatedImage} alt={asset.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 p-6 text-center">
              <a
                href={generatedImage}
                target="_blank"
                className="btn-primary !py-2 !px-6 !text-xs w-full"
              >
                Download
              </a>
              <button
                onClick={() => setGeneratedImage(null)}
                className="py-2 px-6 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border border-white/10 w-full"
              >
                Regenerate
              </button>
            </div>
          </>
        ) : isGenerating ? (
          <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent animate-pulse">Rendering Design…</span>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            className="w-full h-full bg-white/[0.03] hover:bg-white/[0.06] border-y border-white/5 flex flex-col items-center justify-center gap-4 transition-all group/btn"
          >
            <div className="w-14 h-14 rounded-full bg-accent/10 group-hover/btn:bg-accent/20 flex items-center justify-center transition-all">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest group-hover/btn:text-white/60">Generate High-End Visual</span>
          </button>
        )}
      </div>

      {/* Prompt Footer */}
      <div className="p-4 bg-white/[0.01] border-t border-white/5 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setShowPrompt(!showPrompt)}
            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white/40 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
          >
            {showPrompt ? 'Hide Prompt' : 'View AI Prompt'}
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(asset.full_image_prompt)}
            className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white/40 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
          >
            Copy
          </button>
        </div>
        {showPrompt && (
          <div className="animate-fade">
            <div className="bg-black/50 rounded-lg p-3 border border-white/5">
              <p className="text-[10px] text-white/20 font-mono leading-relaxed line-clamp-4 select-all">
                {asset.full_image_prompt}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface SermonArtGalleryProps {
  assets: SermonImage[];
}

export default function SermonArtGallery({ assets }: SermonArtGalleryProps) {
  return (
    <div className="space-y-12 animate-fade">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-[1px] bg-accent/30" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Visual Engine</span>
        </div>
        <h2 className="text-4xl font-extrabold text-white tracking-tighter">Sermon Art Suite</h2>
        <p className="text-white/30 text-sm max-w-xl font-medium">Generate high-end, branded graphics for social media, YouTube thumbnails, and church presentations.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {assets.map((asset, index) => (
          <SermonArtCard key={index} asset={asset} />
        ))}
      </div>
    </div>
  );
}
