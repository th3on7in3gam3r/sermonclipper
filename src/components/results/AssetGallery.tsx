'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';

interface SermonImage {
  title: string;
  description: string;
  full_image_prompt: string;
}

interface QuoteVerse {
  type: string;
  text: string;
  reference?: string;
  full_image_prompt: string;
}

interface AssetCardProps {
  asset: SermonImage | QuoteVerse;
  type: 'sermon' | 'quote';
}

function AssetCard({ asset, type }: AssetCardProps) {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const prompt = (asset as SermonImage & QuoteVerse).full_image_prompt || (asset as SermonImage & QuoteVerse & { prompt?: string; image_prompt?: string }).prompt || (asset as SermonImage & QuoteVerse & { image_prompt?: string }).image_prompt;
  const title = (asset as SermonImage).title || (asset as QuoteVerse).text;
  const subtitle = (asset as SermonImage).description || (asset as QuoteVerse).reference || (asset as QuoteVerse).type;

  const handleGenerate = async () => {
    if (!prompt) {
      alert('Missing image prompt in data. Cannot generate image.');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedImage(data.imageUrl);
      } else {
        alert(data.error || 'Failed to generate image');
      }
    } catch {
      alert('Error connecting to DALL-E');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`glass-card p-8 space-y-6 border-t-4 ${type === 'sermon' ? 'border-amber-500' : 'border-violet-500'} relative overflow-hidden group bg-zinc-900/40 border-x border-b border-white/5`}>
      {generatedImage ? (
        <div className="aspect-[9/16] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group/img">
          <img src={generatedImage} alt="Generated Visual" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center p-6 text-center">
            <a 
              href={generatedImage} 
              target="_blank" 
              className="px-6 py-3 bg-white text-black font-black rounded-xl hover:scale-105 transition-transform text-sm tracking-widest uppercase"
            >
              Full Resolution
            </a>
          </div>
        </div>
      ) : isGenerating ? (
        <div className="aspect-[9/16] w-full rounded-2xl bg-zinc-950 flex flex-col items-center justify-center space-y-4 border border-white/5 animate-pulse">
          <div className={`w-10 h-10 border-4 ${type === 'sermon' ? 'border-amber-500' : 'border-violet-500'} border-t-transparent rounded-full animate-spin`} />
          <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500 text-center px-8 leading-relaxed">DALL-E is crafting your {type} masterpiece...</p>
        </div>
      ) : (
        <div className="aspect-[9/16] w-full rounded-2xl bg-zinc-950 flex flex-col items-center justify-center space-y-6 border border-white/5 border-dashed group-hover:border-white/20 transition-all cursor-pointer" onClick={handleGenerate}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all group-hover:scale-110 shadow-2xl ${type === 'sermon' ? 'bg-amber-600 shadow-amber-600/20' : 'bg-violet-600 shadow-violet-600/20'}`}>
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div className="text-center">
            <span className="text-sm font-black text-zinc-600 uppercase tracking-[0.3em] block">Generate Design</span>
          </div>
        </div>
      )}

      <div className="space-y-4 relative z-10">
        <div className="space-y-1">
          <span className={`text-sm font-black uppercase tracking-[0.4em] ${type === 'sermon' ? 'text-amber-500/60' : 'text-violet-500/60'}`}>
            {type === 'sermon' ? 'Branding Suite' : 'Spiritual Content'}
          </span>
          <h3 className="text-lg font-black italic leading-tight text-white tracking-tight uppercase line-clamp-3">
            {title}
          </h3>
        </div>
        {subtitle && (
          <p className="text-sm text-zinc-500 leading-relaxed italic border-l-2 border-white/5 pl-4">{subtitle}</p>
        )}
      </div>

      <button 
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(prompt ?? '');
          alert('Design prompt copied!');
        }}
        className="w-full py-4 bg-white/5 hover:bg-white/10 text-zinc-400 font-black rounded-xl transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-widest border border-white/5"
      >
        Copy Prompt
      </button>
    </div>
  );
}

interface AssetGalleryProps {
  assets: (SermonImage | QuoteVerse)[];
  type: 'sermon' | 'quote';
}

export default function AssetGallery({ assets, type }: AssetGalleryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {assets.map((asset, index) => (
        <AssetCard key={index} asset={asset} type={type} />
      ))}
    </div>
  );
}
