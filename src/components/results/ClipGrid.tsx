'use client';

import { useState } from 'react';

interface Clip {
  id: string;
  title: string;
  hook_title?: string;
  url: string;
  thumbnailUrl?: string;
  start_time: number;
  end_time: number;
  main_quote?: string;
  why_it_works?: string;
  reason?: string;
  hashtags?: string;
  suggested_captions?: string[];
  clip_number?: number;
}

interface ClipGridProps {
  clips: Clip[];
}

export default function ClipGrid({ clips }: ClipGridProps) {
  const validClips = clips.filter(c => typeof c.url === 'string' && c.url.trim().length > 0);

  if (validClips.length === 0) {
    return (
      <div className="glass-card p-16 text-center">
        <p className="text-white/40 font-semibold uppercase tracking-widest text-xs">Processing Video Streams</p>
        <p className="text-white/20 text-sm mt-4 max-w-sm mx-auto font-medium">We&apos;re finalizing your clips. Please refresh in a moment if they haven&apos;t appeared.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {validClips.map((clip, idx) => (
        <ClipItem key={clip.id || idx} clip={clip} />
      ))}
    </div>
  );
}

function ClipItem({ clip }: { clip: Clip }) {
  const [videoError, setVideoError] = useState(false);

  if (videoError) return null;

  return (
    <div className="glass-card !p-0 flex flex-col group overflow-hidden border-white/5 hover:border-primary/40 transition-all duration-500">
      {/* Video Preview */}
      <div className="aspect-[9/16] bg-black relative max-h-[480px] overflow-hidden">
        <video
          src={clip.url}
          poster={clip.thumbnailUrl}
          controls
          preload="metadata"
          playsInline
          onError={() => setVideoError(true)}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
        />
        {clip.clip_number && (
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-2xl z-10">
            Clip #{clip.clip_number}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Info Section */}
      <div className="p-6 space-y-6 flex-1 flex flex-col bg-[#0d0d0d]">
        <div className="space-y-3">
          <h3 className="font-bold text-white text-lg leading-tight tracking-tight group-hover:text-primary transition-colors">
            {clip.hook_title || clip.title}
          </h3>

          {clip.main_quote && (
            <p className="text-white/40 text-sm leading-relaxed italic border-l-2 border-primary/40 pl-4">
              &quot;{clip.main_quote}&quot;
            </p>
          )}

          {(clip.why_it_works || clip.reason) && (
            <p className="text-white/20 text-[11px] leading-relaxed font-medium">
              {clip.why_it_works || clip.reason}
            </p>
          )}
        </div>

        <div className="mt-auto space-y-5">
          {clip.hashtags && (
            <div className="flex flex-wrap gap-2">
              {clip.hashtags.split(' ').map((tag, i) => (
                <span key={i} className="text-primary text-[10px] font-bold tracking-widest">{tag}</span>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                const text = clip.suggested_captions?.[0] || clip.main_quote || '';
                navigator.clipboard.writeText(text);
              }}
              className="py-3 px-4 bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Copy Caption
            </button>
            <a
              href={clip.url}
              target="_blank"
              rel="noreferrer"
              className="py-3 px-4 bg-primary hover:bg-primary-hover text-white text-[10px] font-bold uppercase tracking-widest rounded-xl text-center transition-all flex items-center justify-center gap-2"
            >
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
