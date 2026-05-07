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
    if (!asset.full_image_prompt) { alert('Missing image prompt.'); return; }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt: asset.full_image_prompt }),
      });
      const data = await res.json();
      if (data.success) setGeneratedImage(data.imageUrl);
      else alert(data.error || 'Failed to generate image');
    } catch {
      alert('Error connecting to image API');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="card flex flex-col overflow-hidden">
      {/* Preview header */}
      {!generatedImage && !isGenerating && (
        <div className="p-5 bg-amber-50 border-b border-amber-100 space-y-1.5">
          <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            Sermon Art
          </span>
          <h3 className="font-bold text-stone-800 text-sm leading-snug line-clamp-2">{asset.title}</h3>
          <p className="text-stone-500 text-xs leading-relaxed line-clamp-2">{asset.description}</p>
        </div>
      )}

      {/* Image area */}
      <div className="flex-1">
        {generatedImage ? (
          <div className="aspect-[9/16] relative group/img overflow-hidden">
            <img src={generatedImage} alt={asset.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
              <a
                href={generatedImage}
                target="_blank"
                className="px-5 py-2.5 bg-white text-stone-800 font-semibold rounded-xl text-sm hover:bg-stone-100 transition-all"
              >
                Download
              </a>
              <button
                onClick={() => setGeneratedImage(null)}
                className="px-5 py-2.5 bg-white/20 text-white font-semibold rounded-xl text-sm hover:bg-white/30 transition-all border border-white/30"
              >
                Regenerate
              </button>
            </div>
          </div>
        ) : isGenerating ? (
          <div className="aspect-[9/16] bg-amber-50 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-xs text-amber-600 font-medium">Generating…</p>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            className="aspect-[9/16] w-full bg-stone-50 hover:bg-amber-50 border-2 border-dashed border-stone-200 hover:border-amber-300 flex flex-col items-center justify-center gap-3 transition-all group/btn"
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 group-hover/btn:bg-amber-200 flex items-center justify-center transition-all">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-stone-500 group-hover/btn:text-amber-600 transition-colors">Generate Design</span>
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-stone-100 flex gap-2">
        <button
          onClick={() => setShowPrompt(!showPrompt)}
          className="flex-1 py-2 bg-stone-50 hover:bg-stone-100 text-stone-600 text-xs font-semibold rounded-lg transition-all border border-stone-200"
        >
          {showPrompt ? 'Hide Prompt' : 'View Prompt'}
        </button>
        <button
          onClick={() => { navigator.clipboard.writeText(asset.full_image_prompt); }}
          className="py-2 px-3 bg-stone-50 hover:bg-stone-100 text-stone-500 text-xs font-semibold rounded-lg transition-all border border-stone-200"
          title="Copy prompt"
        >
          Copy
        </button>
      </div>
      {showPrompt && (
        <div className="px-4 pb-4">
          <p className="text-xs text-stone-500 font-mono leading-relaxed bg-stone-50 rounded-lg p-3 border border-stone-100 line-clamp-4">
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
    <div className="space-y-6">
      <div className="pb-4 border-b border-stone-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-full">
            Sermon Art
          </span>
        </div>
        <h2 className="text-2xl font-black text-stone-800 tracking-tight">Visual Suite</h2>
        <p className="text-stone-500 text-sm mt-1">Generate premium graphics for social media and presentations.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {assets.map((asset, index) => (
          <SermonArtCard key={index} asset={asset} />
        ))}
      </div>
    </div>
  );
}
