'use client';

import type { LibraryItem } from '@/components/dashboard/ClipLibrary';
import { useEffect, useRef, useState } from 'react';
import { openStudio } from '@/lib/studioNavigation';
import { triggerReelDownload } from '@/lib/reelDownload';
import { resolveClientPlaybackUrl } from '@/lib/resolvePlaybackUrl';
import { needsMediaDeliveryResolve } from '@/lib/videoSource';
import { parseTime } from '@/lib/parseTime';

type ClipPreviewPanelProps = {
  item: LibraryItem;
  onClose: () => void;
  onDelete: (item: LibraryItem) => void;
  onExport: (item: LibraryItem) => void;
  onShare: (item: LibraryItem) => void;
  resultsHref: string;
  videoUrl?: string;
  captionText?: string;
};

export default function ClipPreviewPanel({
  item,
  onClose,
  onDelete,
  onExport,
  onShare,
  resultsHref,
  videoUrl,
  captionText,
}: ClipPreviewPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playableSrc, setPlayableSrc] = useState<string | null>(null);

  const rawSrc = videoUrl || item.finalPath || item.videoUrl;
  const clipStartSec = parseTime(item.clipStart);

  useEffect(() => {
    if (!rawSrc) {
      setPlayableSrc(null);
      return;
    }
    if (!needsMediaDeliveryResolve(rawSrc)) {
      setPlayableSrc(rawSrc);
      return;
    }

    let cancelled = false;
    void resolveClientPlaybackUrl(rawSrc)
      .then((resolved) => {
        if (!cancelled) setPlayableSrc(resolved);
      })
      .catch(() => {
        if (!cancelled) setPlayableSrc(null);
      });

    return () => {
      cancelled = true;
    };
  }, [rawSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playableSrc || clipStartSec <= 0) return;

    const seekToStart = () => {
      try {
        video.currentTime = Math.min(clipStartSec, Math.max(video.duration - 0.1, 0));
      } catch {
        /* ignore */
      }
    };

    video.addEventListener('loadedmetadata', seekToStart);
    if (video.readyState >= 1) seekToStart();

    return () => {
      video.removeEventListener('loadedmetadata', seekToStart);
    };
  }, [playableSrc, clipStartSec]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        videoRef.current?.pause();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleClose = () => {
    videoRef.current?.pause();
    onClose();
  };

  return (
    <div className="clip-preview-overlay" onClick={handleClose}>
      <aside className="clip-preview-panel glass-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="clip-preview-close" onClick={handleClose} aria-label="Close preview">
          ×
        </button>
        <div className="clip-preview-video-wrap">
          {playableSrc ? (
            <video
              ref={videoRef}
              key={playableSrc}
              className="clip-preview-video"
              controls
              playsInline
              src={playableSrc}
            />
          ) : (
            <div className="clip-preview-video clip-preview-video--loading">Loading preview…</div>
          )}
          {captionText && <div className="clip-preview-caption">{captionText}</div>}
        </div>
        <div className="clip-preview-meta">
          <h2>{item.title}</h2>
          <p className="clip-preview-source">{item.sermonTitle}</p>
          <dl className="clip-preview-details">
            <div>
              <dt>Duration</dt>
              <dd>{item.durationSec ? `${Math.round(item.durationSec)}s` : '—'}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{new Date(item.createdAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt>Export status</dt>
              <dd>{item.exportStatus === 'complete' ? 'Exported' : 'Not exported'}</dd>
            </div>
          </dl>
        </div>
        <div className="clip-preview-actions">
          <button
            type="button"
            className="vesper-btn vesper-btn-primary"
            onClick={() => {
              if (videoUrl) void triggerReelDownload(videoUrl, item.title);
              else onExport(item);
            }}
          >
            Download
          </button>
          <button
            type="button"
            className="vesper-btn-outline clip-preview-action-link"
            onClick={() => openStudio(item.jobId, item.clipIndex)}
          >
            Open in Studio
          </button>
          <button type="button" className="vesper-btn-outline" onClick={() => onShare(item)}>
            Share
          </button>
          <button
            type="button"
            className="vesper-btn-outline clip-preview-delete"
            onClick={() => {
              if (confirm('Delete this clip project?')) {
                videoRef.current?.pause();
                onDelete(item);
                onClose();
              }
            }}
          >
            Delete
          </button>
        </div>
      </aside>
    </div>
  );
}
