'use client';

import { useState, useEffect } from 'react';

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

// ClipGrid intentionally hides invalid clips and reports a safe metric count.
// This keeps the results page professional and prevents failure-state cards from appearing.
function isClipUrlValid(clip: Clip) {
  return typeof clip.url === 'string' && clip.url.trim().length > 0;
}

export default function ClipGrid({ clips }: ClipGridProps) {
  const validClips = clips.filter(isClipUrlValid);
  const [invalidClipCount, setInvalidClipCount] = useState(clips.length - validClips.length);

  useEffect(() => {
    setInvalidClipCount(clips.length - validClips.length);
  }, [clips]);

  useEffect(() => {
    if (invalidClipCount > 0) {
      console.info(
        `[METRIC] Hidden ${invalidClipCount} invalid clip${invalidClipCount === 1 ? '' : 's'} due to missing URLs or unsupported playback.`
      );
    }
  }, [invalidClipCount]);

  const handleInvalidClip = () => {
    setInvalidClipCount((prev) => prev + 1);
  };

  if (validClips.length === 0) {
    return (
      <div className="p-20 text-center glass-card border border-white/5 bg-zinc-950/20">
        <p className="text-zinc-500 font-black uppercase tracking-[0.4em]">No Valid Clips Found in Media Kit</p>
        <p className="text-zinc-600 text-sm mt-2">Some clips may have exceeded the source video duration or failed validation.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {validClips.map((clip, index) => (
        <ClipItem key={clip.id || index} clip={clip} index={index} onInvalid={handleInvalidClip} />
      ))}
    </div>
  );
}

function ClipItem({ clip, index, onInvalid }: { clip: Clip; index: number; onInvalid: () => void }) {
  const [videoError, setVideoError] = useState(false);
  const [fileExists, setFileExists] = useState(true);
  const [hasReportedInvalid, setHasReportedInvalid] = useState(false);

  const reportInvalidClip = () => {
    if (!hasReportedInvalid) {
      setHasReportedInvalid(true);
      onInvalid();
    }
  };

  // Check if video file exists on mount
  useEffect(() => {
    const checkFileExists = async () => {
      try {
        const response = await fetch(clip.url, { method: 'HEAD' });
        if (!response.ok) {
          console.warn(`[DEBUG] Video file not accessible: ${clip.url}`);
          setFileExists(false);
        }
      } catch (err) {
        console.warn(`[DEBUG] Failed to check video file: ${clip.url}`, err);
        setFileExists(false);
      }
    };
    
    checkFileExists();
  }, [clip.url]);

  useEffect(() => {
    if (!fileExists) {
      reportInvalidClip();
    }
  }, [fileExists]);

  // Don't render if file doesn't exist or the video failed to play
  if (!fileExists || videoError) {
    return null;
  }

  return (
    <div className="glass-card flex flex-col overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-2xl bg-zinc-900/40 border border-white/5">
      <div className="aspect-[9/16] bg-zinc-950 relative max-h-[500px] overflow-hidden">
        <video 
          src={clip.url}
          poster={clip.thumbnailUrl}
          controls 
          preload="metadata"
          playsInline
          onLoadStart={() => console.log(`[DEBUG] Video Load Start: ${clip.url}`)}
          onLoadedMetadata={(e) => console.log(`[DEBUG] Video Metadata Loaded. Duration: ${e.currentTarget.duration}`)}
          onError={(e) => {
            const error = e.currentTarget.error;
            if (error?.code === 4) {
              console.warn(`[DEBUG] Unsupported stream: ${clip.url}`);
            } else {
              console.warn(`[DEBUG] Video Playback Error: ${error?.code} | ${error?.message} | ${clip.url}`);
            }
            setVideoError(true);
            reportInvalidClip();
          }}
          onStalled={() => console.warn(`[DEBUG] Video Playback Stalled: ${clip.url}`)}
          onWaiting={() => console.log(`[DEBUG] Video Player Waiting (Buffering): ${clip.url}`)}
          className="w-full h-full object-contain"
        />
      </div>
      <div className="p-8 space-y-6 flex-grow flex flex-col">
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <h3 className="text-2xl font-black text-violet-400 leading-tight uppercase tracking-tight group-hover:text-white transition-colors">
              {clip.hook_title || clip.title}
            </h3>
            {clip.clip_number && (
              <span className="bg-violet-500/20 text-violet-400 text-sm font-black px-3 py-1 rounded-full border border-violet-500/20 whitespace-nowrap">
                #{clip.clip_number}
              </span>
            )}
          </div>
          
          {clip.main_quote && (
            <div className="p-4 bg-violet-500/5 border-l-2 border-violet-500/50 rounded-r-lg">
              <p className="text-zinc-300 text-sm leading-relaxed font-medium italic">
                "{clip.main_quote}"
              </p>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-sm font-black text-zinc-600 uppercase tracking-widest">Editor's Note</span>
            <p className="text-zinc-500 text-sm leading-relaxed italic opacity-80">
              {clip.why_it_works || clip.reason}
            </p>
          </div>
        </div>
        <div className="mt-auto space-y-4">
          {clip.hashtags && (
            <p className="text-violet-300 text-sm font-medium">
              {clip.hashtags}
            </p>
          )}
          {clip.suggested_captions && clip.suggested_captions.length > 0 && (
            <div className="space-y-2">
              <p className="text-zinc-400 text-sm font-black uppercase tracking-widest">Suggested Captions</p>
              <div className="space-y-2">
                {clip.suggested_captions.slice(0, 2).map((caption, idx) => (
                  <p key={idx} className="text-zinc-500 text-sm leading-relaxed">
                    {caption}
                  </p>
                ))}
              </div>
            </div>
          )}
          <a
            href={clip.url}
            target="_blank"
            rel="noreferrer"
            className="block w-full rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-white text-center transition hover:bg-violet-500"
          >
            Download Clip
          </a>
        </div>
      </div>
    </div>
  );
}
