'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface ShareExportModalProps {
  clipTitle: string;
  renderUrl: string;
  onClose: () => void;
}

type Platform = 'instagram' | 'tiktok' | 'youtube';

const PLATFORMS: { id: Platform; label: string; icon: string }[] = [
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'youtube', label: 'YouTube Shorts', icon: '▶️' },
];

export default function ShareExportModal({ clipTitle, renderUrl, onClose }: ShareExportModalProps) {
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const [posting, setPosting] = useState<Platform | null>(null);
  const [postUrl, setPostUrl] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    fetch('/api/social/connections')
      .then((r) => r.json())
      .then((data) => setConnections(data.connections || {}))
      .catch(() => {});
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const copyLink = () => {
    if (!renderUrl) {
      toast.error('Export the clip first to get a shareable link.');
      return;
    }
    navigator.clipboard.writeText(renderUrl);
    toast.success('Link copied');
  };

  const download = () => {
    if (!renderUrl) {
      toast.error('Export the clip first.');
      return;
    }
    window.open(renderUrl, '_blank');
  };

  const shareTo = async (platform: Platform) => {
    if (!renderUrl) {
      toast.error('Export the clip first, then share.');
      return;
    }

    if (!connections[platform]) {
      const res = await fetch(`/api/social/connect?platform=${platform}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toast.error('Could not start OAuth. Connect accounts in Settings.');
      return;
    }

    setPosting(platform);
    setPostUrl('');
    try {
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, videoUrl: renderUrl, title: clipTitle }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Publish failed. Download the MP4 instead.');
        return;
      }

      setPostUrl(data.postUrl || '');
      toast.success(`Posted to ${platform}`);
    } catch {
      toast.error('Publish failed. Download the MP4 as a fallback.');
    } finally {
      setPosting(null);
    }
  };

  return (
    <div className="export-flow-overlay" role="presentation" onClick={onClose}>
      <div
        className="export-flow-card glass-card premium-border"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="export-flow-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <h2 className="export-flow-title">Share clip</h2>
        <p className="export-flow-subtitle">{clipTitle}</p>

        <div className="share-export-actions">
          <button type="button" className="vesper-btn-outline" onClick={download}>
            Download
          </button>
          <button type="button" className="vesper-btn-outline" onClick={copyLink}>
            Copy link
          </button>
        </div>

        <p className="export-flow-label">Direct publish</p>
        <div className="share-export-platforms">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="export-flow-option"
              disabled={posting === p.id}
              onClick={() => shareTo(p.id)}
            >
              <span>{p.icon}</span>
              <strong>{p.label}</strong>
              {!connections[p.id] && <span className="share-export-connect-hint">Connect</span>}
            </button>
          ))}
        </div>

        {postUrl && (
          <p className="share-export-live">
            Live post:{' '}
            <a href={postUrl} target="_blank" rel="noreferrer">
              {postUrl}
            </a>
          </p>
        )}

        <p className="share-export-footnote">
          Manage connected accounts in{' '}
          <a href="/dashboard/settings">Account Settings</a>.
        </p>
      </div>
    </div>
  );
}
