'use client';

import { useState } from 'react';

interface QuoteVerse {
  type: string;
  text: string;
  reference?: string;
  full_image_prompt: string;
}

function QuoteVerseCard({ asset }: { asset: QuoteVerse }) {
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
      {/* Quote preview */}
      {!generatedImage && !isGenerating && (
        <div className="p-5 bg-indigo-50 border-b border-indigo-100 space-y-2">
          <span className="inline-block px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
            Scripture Art
          </span>
          <p className="font-semibold text-stone-800 text-sm leading-snug italic line-clamp-3">
            &quot;{asset.text}&quot;
          </p>
          {asset.reference && (
            <p className="text-indigo-600 text-xs font-semibold">— {asset.reference}</p>
          )}
        </div>
      )}

      {/* Image area */}
      <div className="flex-1">
        {generatedImage ? (
          <div className="aspect-[9/16] relative group/img overflow-hidden">
            <img src={generatedImage} alt={asset.text} className="w-full h-full object-cover" />
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
          <div className="aspect-[9/16] bg-indigo-50 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs text-indigo-600 font-medium">Generating…</p>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            className="aspect-[9/16] w-full bg-stone-50 hover:bg-indigo-50 border-2 border-dashed border-stone-200 hover:border-indigo-300 flex flex-col items-center justify-center gap-3 transition-all group/btn"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-100 group-hover/btn:bg-indigo-200 flex items-center justify-center transition-all">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-stone-500 group-hover/btn:text-indigo-600 transition-colors">Generate Design</span>
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

interface QuoteVerseGalleryProps {
  assets: QuoteVerse[];
}

export default function QuoteVerseGallery({ assets }: QuoteVerseGalleryProps) {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-stone-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-full">
            Scripture Gallery
          </span>
        </div>
        <h2 className="text-2xl font-black text-stone-800 tracking-tight">Verse Art</h2>
        <p className="text-stone-500 text-sm mt-1">Turn powerful scriptures into shareable visual designs.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {assets.map((asset, index) => (
          <QuoteVerseCard key={index} asset={asset} />
        ))}
      </div>
    </div>
  );
}
