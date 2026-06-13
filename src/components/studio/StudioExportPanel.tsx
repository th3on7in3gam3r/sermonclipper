'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import ShareExportModal from '@/components/dashboard/ShareExportModal';
import type { RenderState } from '@/lib/studio/types';
import { triggerReelDownload } from '@/lib/reelDownload';

interface StudioExportPanelProps {
  renderState?: RenderState;
  renderProgress: number;
  isYouTubeSource: boolean;
  clipTitle: string;
  onGenerate: () => void;
  /** Hide the save-profile slot row when embedded in mobile export tab */
  showSaveSlot?: boolean;
  onSaveProfile?: () => void;
}

export default function StudioExportPanel({
  renderState,
  renderProgress,
  isYouTubeSource,
  clipTitle,
  onGenerate,
  showSaveSlot = true,
  onSaveProfile,
}: StudioExportPanelProps) {
  const [showShare, setShowShare] = useState(false);

  const status = renderState?.status;
  const renderUrl = renderState?.url;
  const isComplete = status === 'complete' && !!renderUrl;
  const isLoading = status === 'loading';
  const isError = status === 'error';

  const handleDownload = () => {
    if (!renderUrl) return;
    triggerReelDownload(renderUrl, clipTitle);
    toast.success('Download started');
  };

  const handleCopyLink = () => {
    if (!renderUrl) return;
    navigator.clipboard.writeText(renderUrl);
    toast.success('Share link copied');
  };

  return (
    <>
      {isComplete && (
        <div className="studio-export-ready" role="status">
          <span className="studio-export-ready-icon" aria-hidden>
            ✓
          </span>
          <div>
            <p className="studio-export-ready-title">Your reel is ready</p>
            <p className="studio-export-ready-sub">Download the MP4 or share to social.</p>
          </div>
        </div>
      )}

      <div className="studio-export-actions">
        {showSaveSlot && onSaveProfile && (
          <button
            type="button"
            onClick={onSaveProfile}
            className="vesper-btn-outline studio-export-save"
            title="Save as default brand profile"
          >
            💾
          </button>
        )}

        {isComplete ? (
          <>
            <button
              type="button"
              onClick={handleDownload}
              className="vesper-btn vesper-btn-primary shimmer-effect studio-export-download"
            >
              Download
            </button>
            <button
              type="button"
              onClick={() => setShowShare(true)}
              className="vesper-btn-outline studio-export-share"
            >
              Share
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onGenerate}
            className="vesper-btn vesper-btn-primary shimmer-effect studio-export-generate"
            disabled={isLoading || isYouTubeSource}
            style={{ opacity: isLoading || isYouTubeSource ? 0.65 : 1 }}
          >
            {isLoading
              ? `Generating… ${renderProgress}%`
              : isYouTubeSource
                ? 'Upload MP4 to export'
                : isError
                  ? 'Try again'
                  : 'Generate Reel'}
          </button>
        )}
      </div>

      {isComplete && (
        <div className="studio-export-secondary">
          <button type="button" className="studio-export-link-btn" onClick={handleCopyLink}>
            Copy shareable link
          </button>
          {!isYouTubeSource && (
            <button type="button" className="studio-export-link-btn" onClick={onGenerate}>
              Re-render with new styles
            </button>
          )}
        </div>
      )}

      {isLoading && (
        <div className="studio-export-progress">
          <div className="studio-export-progress-bar">
            <div style={{ width: `${renderProgress}%` }} />
          </div>
          <p className="studio-export-progress-label">Cloud render in progress… {renderProgress}%</p>
        </div>
      )}

      {isError && renderState?.error && (
        <p className="studio-export-error" role="alert">
          {renderState.error}
        </p>
      )}

      {showShare && renderUrl && (
        <ShareExportModal clipTitle={clipTitle} renderUrl={renderUrl} onClose={() => setShowShare(false)} />
      )}
    </>
  );
}
