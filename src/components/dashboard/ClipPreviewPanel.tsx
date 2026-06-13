'use client';

import type { LibraryItem } from '@/components/dashboard/ClipLibrary';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { triggerReelDownload } from '@/lib/reelDownload';

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

  const src = videoUrl || item.finalPath || item.videoUrl;

  return (
    <div className="clip-preview-overlay" onClick={handleClose}>
      <aside className="clip-preview-panel glass-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="clip-preview-close" onClick={handleClose} aria-label="Close preview">
          ×
        </button>
        <div className="clip-preview-video-wrap">
          <video ref={videoRef} className="clip-preview-video" controls playsInline src={src} />
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
          <Link href={resultsHref} className="vesper-btn-outline clip-preview-action-link">
            Open in Studio
          </Link>
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
