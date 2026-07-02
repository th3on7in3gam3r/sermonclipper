'use client';

import { useState } from 'react';
import HeroUploadZone from '@/components/home/HeroUploadZone';
import HeroYouTubeInput from '@/components/home/HeroYouTubeInput';
import HeroPodcastInput from '@/components/home/HeroPodcastInput';

type ImportTab = 'upload' | 'youtube' | 'podcast';

const TABS: { id: ImportTab; label: string; badge?: string }[] = [
  { id: 'upload', label: 'Upload file', badge: 'Recommended' },
  { id: 'youtube', label: 'YouTube link' },
  { id: 'podcast', label: 'Podcast RSS' },
];

const TAB_NOTES: Record<ImportTab, string> = {
  upload:
    'Best for full exports — upload an MP4, MOV, or M4A file (download from YouTube first if needed). Vesper renders 9:16 reels with captions.',
  youtube:
    'Preview and clip discovery only. For exportable reels, download the sermon as MP4 or M4A, then switch to Upload file.',
  podcast: 'Load episodes from your feed and turn audio sermons into clips automatically.',
};

interface HeroImportHubProps {
  isMobile: boolean;
  onFileSelect: (file: File) => void;
  youtubeUrl: string;
  youtubeError?: string | null;
  youtubeNotice?: string | null;
  youtubeValidating?: boolean;
  onYoutubeUrlChange: (url: string) => void;
  onYoutubeSubmit: () => void;
  onPodcastProcessingStart: (jobId: string) => void;
}

export default function HeroImportHub({
  isMobile,
  onFileSelect,
  youtubeUrl,
  youtubeError,
  youtubeNotice,
  youtubeValidating,
  onYoutubeUrlChange,
  onYoutubeSubmit,
  onPodcastProcessingStart,
}: HeroImportHubProps) {
  const [activeTab, setActiveTab] = useState<ImportTab>('upload');

  return (
    <div className="hero-import-hub animate-in" style={{ animationDelay: '0.15s' }}>
      <div className="hero-import-hub-card glass-card premium-border">
        <header className="hero-import-hub-header">
          <p className="hero-import-hub-kicker">Get started</p>
          <h2 className="hero-import-hub-title">Import your sermon</h2>
          <p className="hero-import-hub-subtitle">
            Choose how you want to bring content into Vesper — one workspace, three flexible paths.
          </p>
        </header>

        <div className="hero-import-tabs" role="tablist" aria-label="Import method">
          {TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`hero-import-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`hero-import-panel-${tab.id}`}
                className={`hero-import-tab${selected ? ' hero-import-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
                {tab.badge ? <span className="hero-import-tab-badge">{tab.badge}</span> : null}
              </button>
            );
          })}
        </div>

        <div
          id={`hero-import-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`hero-import-tab-${activeTab}`}
          className="hero-import-panel"
        >
          {activeTab === 'upload' && (
            <HeroUploadZone isMobile={isMobile} embedded onFileSelect={onFileSelect} />
          )}
          {activeTab === 'youtube' && (
            <HeroYouTubeInput
              embedded
              isMobile={isMobile}
              url={youtubeUrl}
              error={youtubeError}
              notice={youtubeNotice}
              isValidating={youtubeValidating}
              onUrlChange={onYoutubeUrlChange}
              onSubmit={onYoutubeSubmit}
            />
          )}
          {activeTab === 'podcast' && (
            <HeroPodcastInput embedded isMobile={isMobile} onProcessingStart={onPodcastProcessingStart} />
          )}
        </div>

        <p className="hero-import-footnote">{TAB_NOTES[activeTab]}</p>
      </div>
    </div>
  );
}
