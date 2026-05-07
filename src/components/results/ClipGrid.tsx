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

function isClipUrlValid(clip: Clip) {
  return typeof clip.url === 'string' && clip.url.trim().length > 0;
}

export default function ClipGrid({ clips }: ClipGridProps) {
  const validClips = clips.filter(isClipUrlValid);
  const [invalidClipCount, setInvalidClipCount] = useState(clips.length - validClips.length);

  useEffect(() => {
    Promise.resolve().then(() => setInvalidClipCount(clips.length - validClips.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clips]);

  useEffect(() => {
    if (invalidClipCount > 0) {
      console.info(`[METRIC] Hidden ${invalidClipCount} invalid clip(s).`);
    }
  }, [invalidClipCount]);

  const handleInvalidClip = () => setInvalidClipCount((prev) => prev + 1);

  if (validClips.length === 0) {
    return (
      <div className="card p-16 text-center">
        <p className="text-stone-500 font-semibold">No valid clips found</p>
        <p className="text-stone-400 text-sm mt-1">Clips may have exceeded the source video duration.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {validClips.map((clip, idx) => (
        <ClipItem key={clip.id || idx} clip={clip} onInvalid={handleInvalidClip} />
      ))}
    </div>
  );
}

function ClipItem({ clip, onInvalid }: { clip: Clip; onInvalid: () => void }) {
  const [videoError, setVideoError] = useState(false);
  const [fileExists, setFileExists] = useState(true);
  const [hasReportedInvalid, setHasReportedInvalid] = useState(false);

  const reportInvalidClip = () => {
    if (!hasReportedInvalid) {
      setHasReportedInvalid(true);
      onInvalid();
    }
  };

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(clip.url, { method: 'HEAD' });
        if (!res.ok) setFileExists(false);
      } catch {
        setFileExists(false);
      }
    };
    check();
  }, [clip.url]);

  useEffect(() => {
    if (!fileExists) {
      Promise.resolve().then(() => reportInvalidClip());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileExists]);

  if (!fileExists || videoError) return null;

  return (
    <div className="card flex flex-col overflow-hidden hover:shadow-md transition-all duration-300">
      {/* Video */}
      <div className="aspect-[9/16] bg-stone-900 relative max-h-[420px] overflow-hidden">
        <video
          src={clip.url}
          poster={clip.thumbnailUrl}
          controls
          preload="metadata"
          playsInline
          onError={() => {
            setVideoError(true);
            reportInvalidClip();
          }}
          className="w-full h-full object-contain"
        />
        {clip.clip_number && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full shadow">
            #{clip.clip_number}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5 space-y-4 flex-1 flex flex-col">
        <div className="space-y-2">
          <h3 className="font-bold text-stone-800 leading-snug">
            {clip.hook_title || clip.title}
          </h3>

          {clip.main_quote && (
            <p className="text-stone-500 text-sm leading-relaxed italic border-l-2 border-indigo-200 pl-3">
              &quot;{clip.main_quote}&quot;
            </p>
          )}

          {(clip.why_it_works || clip.reason) && (
            <p className="text-stone-400 text-xs leading-relaxed">
              {clip.why_it_works || clip.reason}
            </p>
          )}
        </div>

        <div className="mt-auto space-y-3">
          {clip.hashtags && (
            <p className="text-indigo-500 text-xs font-medium">{clip.hashtags}</p>
          )}
          {clip.suggested_captions && clip.suggested_captions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Captions</p>
              {clip.suggested_captions.slice(0, 2).map((caption, idx) => (
                <p key={idx} className="text-stone-500 text-xs leading-relaxed">{caption}</p>
              ))}
            </div>
          )}
          <a
            href={clip.url}
            target="_blank"
            rel="noreferrer"
            className="block w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl text-center transition-all"
          >
            Download Clip
          </a>
        </div>
      </div>
    </div>
  );
}
