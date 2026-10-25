'use client';

import type { CSSProperties } from 'react';
import type { RenderState } from '@/lib/studio/types';

type Props = {
  titleId: string;
  clipNumber: number;
  clipTitle: string;
  isYouTubeSource: boolean;
  renderState?: RenderState;
  renderProgress: number;
  onBack: () => void;
  onExport: () => void;
  onDownload: () => void;
};

/**
 * Back, the clip's name, and the one primary action. The export button
 * carries its own progress, so it reads correctly from every mobile tab.
 */
export default function StudioTopBar({
  titleId,
  clipNumber,
  clipTitle,
  isYouTubeSource,
  renderState,
  renderProgress,
  onBack,
  onExport,
  onDownload,
}: Props) {
  const status = renderState?.status;
  const isComplete = status === 'complete' && Boolean(renderState?.url);
  const isLoading = status === 'loading';

  let action: { label: string; onClick?: () => void; disabled?: boolean; className: string };
  if (isYouTubeSource) {
    action = { label: 'Preview only', disabled: true, className: 'studio-export-btn is-disabled' };
  } else if (isLoading) {
    action = { label: `Exporting ${renderProgress}%`, disabled: true, className: 'studio-export-btn is-loading' };
  } else if (isComplete) {
    action = { label: 'Download reel', onClick: onDownload, className: 'studio-export-btn' };
  } else if (status === 'error') {
    action = { label: 'Try export again', onClick: onExport, className: 'studio-export-btn' };
  } else {
    action = { label: 'Export reel', onClick: onExport, className: 'studio-export-btn' };
  }

  return (
    <header className="studio-topbar">
      <button type="button" className="studio-back" onClick={onBack}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="studio-back-label">Back to clips</span>
      </button>

      <div className="studio-topbar-title">
        <span className="studio-topbar-clip">Clip {clipNumber}</span>
        <h1 id={titleId} className="studio-topbar-name" tabIndex={-1}>
          {clipTitle}
        </h1>
      </div>

      <button
        type="button"
        className={action.className}
        onClick={action.onClick}
        disabled={action.disabled}
        aria-live="polite"
        title={isYouTubeSource ? 'Reels from YouTube links can be previewed but not exported. Upload the MP4 to export.' : undefined}
        style={isLoading ? ({ '--progress': `${renderProgress}%` } as CSSProperties) : undefined}
      >
        <span>{action.label}</span>
      </button>
    </header>
  );
}
