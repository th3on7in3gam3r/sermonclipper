'use client';

import { useState } from 'react';

interface SermonImage {
  title: string;
  description: string;
  full_image_prompt: string;
}

interface SermonArtCardProps {
  asset: SermonImage;
}

function SermonArtCard({ asset }: SermonArtCardProps) {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const handleGenerate = async () => {
    if (!asset.full_image_prompt) {
      alert('Missing image prompt in data. Cannot generate image.');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt: asset.full_image_prompt }),
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
    <div className="group h-full flex flex-col">
      {/* Concept Preview Card */}
      {!generatedImage && !isGenerating && (
        <div className="bg-gradient-to-br from-amber-600/10 to-amber-900/10 border border-amber-500/20 rounded-2xl p-6 mb-4 space-y-3 flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-black uppercase tracking-widest">
            🎨 Sermon Branding
          </div>
          <div className="space-y-2">
            <h3 className="text-base md:text-sm font-black leading-tight text-white italic line-clamp-2">
              {asset.title}
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3">
              {asset.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-amber-300 text-sm font-black uppercase tracking-wider">📱 Social Media</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-amber-300 text-sm font-black uppercase tracking-wider">🖼️ Slides</span>
          </div>
        </div>
      )}

      {/* Generation Area */}
      <div className="flex-1 flex flex-col">
        {generatedImage ? (
          <div className="aspect-[9/16] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group/img">
            <img src={generatedImage} alt={asset.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center gap-3">
              <a 
                href={generatedImage} 
                target="_blank" 
                className="px-6 py-3 bg-white text-black font-black rounded-xl hover:scale-105 transition-transform text-sm tracking-widest uppercase"
              >
                ⬇️ Download
              </a>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setGeneratedImage(null);
                }}
                className="px-6 py-3 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 font-black rounded-xl transition-all text-sm tracking-widest uppercase border border-amber-500/30"
              >
                🔄 Regenerate
              </button>
            </div>
          </div>
        ) : isGenerating ? (
          <div className="aspect-[9/16] w-full rounded-2xl bg-gradient-to-br from-amber-950/20 to-amber-900/20 flex flex-col items-center justify-center space-y-4 border border-amber-500/20 backdrop-blur-sm">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-amber-500/30 rounded-full" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-amber-500 rounded-full animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-400 mb-1">Crafting Design</p>
              <p className="text-sm text-amber-300/60">AI is generating your premium visual...</p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            className="aspect-[9/16] w-full rounded-2xl bg-gradient-to-br from-amber-600/20 to-amber-900/20 flex flex-col items-center justify-center space-y-4 border-2 border-dashed border-amber-500/30 group-hover:border-amber-500/60 transition-all cursor-pointer group/btn"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center transition-all group-hover/btn:scale-110 bg-amber-600 shadow-2xl shadow-amber-600/30 group-hover/btn:shadow-amber-600/50">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-center">
                <div className="text-sm font-black text-amber-400 uppercase tracking-[0.2em]">Generate Design</div>
                <div className="text-sm text-amber-300/60 mt-1">AI-powered visual creation</div>
            </div>
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowPrompt(!showPrompt);
          }}
          className="flex-1 min-h-[44px] py-3 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 font-black rounded-xl transition-all uppercase text-sm tracking-widest border border-amber-500/30 hover:border-amber-500/60"
        >
          {showPrompt ? '✕ Hide Prompt' : '📋 View Prompt'}
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(asset.full_image_prompt);
            alert('Prompt copied!');
          }}
          className="py-3 px-3 bg-white/5 hover:bg-white/10 text-zinc-400 font-black rounded-xl transition-all uppercase text-sm tracking-widest border border-white/5"
        >
          📋
        </button>
      </div>

      {/* Prompt Preview */}
      {showPrompt && (
        <div className="mt-3 p-3 bg-zinc-900/50 rounded-lg border border-white/5">
          <p className="text-sm text-zinc-400 leading-relaxed font-mono line-clamp-4">
            {asset.full_image_prompt}
          </p>
        </div>
      )}
    </div>
  );
}

interface SermonArtGalleryProps {
  assets: SermonImage[];
}

export default function SermonArtGallery({ assets }: SermonArtGalleryProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-3 border-b border-white/5 pb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-600/10 border border-amber-500/30 text-amber-400 text-sm font-black uppercase tracking-widest">
          🎨 Sermon Branding Assets
        </div>
        <h2 className="text-2xl font-black text-white">Premium Visual Suite</h2>
        <p className="text-zinc-400 text-sm">Generate professional graphics for social media, presentations, and marketing materials based on your sermon themes.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {assets.map((asset, index) => (
          <SermonArtCard key={index} asset={asset} />
        ))}
      </div>
    </div>
  );
}
