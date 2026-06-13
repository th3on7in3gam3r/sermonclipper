'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import HelpTooltip from '@/components/help/HelpTooltip';
import FrameFilmstrip from '@/components/thumbnail/FrameFilmstrip';
import ThumbnailCanvasEditor from '@/components/thumbnail/ThumbnailCanvasEditor';
import ThumbnailInsightsPanel from '@/components/thumbnail/ThumbnailInsightsPanel';
import { HELP_TOOLTIPS } from '@/lib/helpTooltips';
import { THUMB_STYLES, type ThumbStyleId } from '@/lib/thumbnailStyles';

export type ThumbnailState = {
  status: string;
  url?: string;
  variants?: string[];
  reelCoverUrl?: string;
};

interface ThumbnailStudioModalProps {
  clip: {
    hook_title?: string;
    main_quote?: string;
    index: number;
    start?: string;
    end?: string;
  };
  videoSrc: string | null;
  isMobile: boolean;
  thumbPrompt: string;
  onThumbPromptChange: (value: string) => void;
  thumbStyle: ThumbStyleId;
  onThumbStyleChange: (id: ThumbStyleId) => void;
  isGenerating: boolean;
  thumbnail: ThumbnailState | undefined;
  selectedVariantIdx: number;
  onSelectVariant: (idx: number) => void;
  onClose: () => void;
  onGenerate: () => void;
  onSetReelCover?: (url: string) => void;
  youtubeConnected?: boolean;
  clipStartSec: number;
  clipEndSec: number;
}

type Tab = 'frame' | 'design' | 'ai' | 'insights';

function proxyImageUrl(url: string) {
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

export default function ThumbnailStudioModal({
  clip,
  videoSrc,
  isMobile,
  thumbPrompt,
  onThumbPromptChange,
  thumbStyle,
  onThumbStyleChange,
  isGenerating,
  thumbnail,
  selectedVariantIdx,
  onSelectVariant,
  onClose,
  onGenerate,
  onSetReelCover,
  youtubeConnected,
  clipStartSec,
  clipEndSec,
}: ThumbnailStudioModalProps) {
  const [tab, setTab] = useState<Tab>(videoSrc ? 'frame' : 'ai');
  const [selectedTime, setSelectedTime] = useState(clipStartSec);
  const [baseFrameUrl, setBaseFrameUrl] = useState<string | null>(null);
  const [frameLocked, setFrameLocked] = useState(false);

  const variants = thumbnail?.variants?.length ? thumbnail.variants : thumbnail?.url ? [thumbnail.url] : [];
  const activeUrl = variants[selectedVariantIdx] || variants[0];
  const isLoading = isGenerating || thumbnail?.status === 'loading';

  const handleSelectFrame = (time: number, dataUrl: string) => {
    setSelectedTime(time);
    if (!frameLocked) setBaseFrameUrl(dataUrl);
  };

  const lockFrame = () => {
    if (baseFrameUrl) {
      setFrameLocked(true);
      setTab('design');
    }
  };

  const handleDownload = () => {
    if (!activeUrl) return;
    const link = document.createElement('a');
    link.href = proxyImageUrl(activeUrl);
    link.download = `vesper-thumbnail-clip-${clip.index + 1}.png`;
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const tabs: { id: Tab; label: string; show?: boolean }[] = [
    { id: 'frame', label: 'Pick Frame', show: !!videoSrc },
    { id: 'design', label: 'Design', show: !!baseFrameUrl },
    { id: 'ai', label: 'AI Styles' },
    { id: 'insights', label: 'Insights', show: youtubeConnected },
  ];

  return (
    <div className="thumb-modal-overlay" onClick={onClose}>
      <div className="thumb-modal glass-card animate-in premium-border" onClick={(e) => e.stopPropagation()}>
        <div className="thumb-modal-header">
          <div>
            <div className="vesper-badge badge-violet" style={{ marginBottom: '8px' }}>
              VISUAL HARVEST
            </div>
            <h2 className="thumb-modal-title">
              Thumbnail Studio
              <HelpTooltip content={HELP_TOOLTIPS.thumbnailStudio} label="About Thumbnail Studio" />
            </h2>
            <p className="thumb-modal-sub">{clip.hook_title || `Clip ${clip.index + 1}`}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="thumb-modal-close">
            ✕
          </button>
        </div>

        <div className="thumb-modal-tabs">
          {tabs
            .filter((t) => t.show !== false)
            .map((t) => (
              <button
                key={t.id}
                type="button"
                className={`thumb-modal-tab${tab === t.id ? ' thumb-modal-tab--active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
        </div>

        <div className="thumb-modal-body">
          {tab === 'frame' && videoSrc && (
            <div className="thumb-frame-tab">
              <div className="thumb-frame-preview">
                {baseFrameUrl ? (
                  <img src={baseFrameUrl} alt="Selected frame preview" />
                ) : (
                  <p className="thumb-filmstrip-loading">Scrub the timeline to preview a frame.</p>
                )}
              </div>
              <FrameFilmstrip
                videoSrc={videoSrc}
                clipStart={clipStartSec}
                clipEnd={clipEndSec}
                selectedTime={selectedTime}
                onSelectTime={handleSelectFrame}
              />
              <button
                type="button"
                className="vesper-btn vesper-btn-primary"
                disabled={!baseFrameUrl}
                onClick={lockFrame}
              >
                Set as Thumbnail
              </button>
            </div>
          )}

          {tab === 'design' && baseFrameUrl && (
            <ThumbnailCanvasEditor
              baseFrameUrl={baseFrameUrl}
              clipTitle={clip.hook_title || clip.main_quote || `Clip ${clip.index + 1}`}
              onSetReelCover={onSetReelCover}
            />
          )}

          {tab === 'ai' && (
            <>
              {clip.main_quote && <p className="thumb-quote">&ldquo;{clip.main_quote}&rdquo;</p>}
              <label className="thumb-tool-label">HEADLINE ON THUMBNAIL</label>
              <input
                type="text"
                value={thumbPrompt}
                onChange={(e) => onThumbPromptChange(e.target.value)}
                placeholder={clip.hook_title || 'Enter overlay text…'}
                className="vesper-input thumb-ai-input"
              />
              <label className="thumb-tool-label">VISUAL STYLE</label>
              <div className="thumb-style-grid">
                {THUMB_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => onThumbStyleChange(style.id)}
                    className={`vesper-btn-outline thumb-style-btn${thumbStyle === style.id ? ' thumb-style-btn--active' : ''}`}
                  >
                    <span>{style.icon}</span>
                    <span>{style.name}</span>
                  </button>
                ))}
              </div>
              <div className="thumb-ai-preview">
                {isLoading ? (
                  <p className="thumb-filmstrip-loading">Generating neural thumbnails…</p>
                ) : activeUrl ? (
                  <img src={proxyImageUrl(activeUrl)} alt="Generated thumbnail" />
                ) : (
                  <p className="thumb-filmstrip-loading">Generate AI thumbnails or pick a frame from your clip.</p>
                )}
              </div>
              {variants.length > 1 && (
                <div className="thumb-variant-row">
                  {variants.map((url, idx) => (
                    <button key={idx} type="button" onClick={() => onSelectVariant(idx)} className="thumb-variant-btn">
                      <img src={proxyImageUrl(url)} alt="" />
                    </button>
                  ))}
                </div>
              )}
              <div className="thumb-export-btns">
                <button type="button" onClick={onGenerate} disabled={isLoading} className="vesper-btn vesper-btn-primary">
                  {activeUrl ? 'Regenerate' : 'Generate thumbnails'}
                </button>
                {activeUrl && (
                  <button type="button" onClick={handleDownload} className="vesper-btn-outline">
                    Download
                  </button>
                )}
              </div>
            </>
          )}

          {tab === 'insights' && youtubeConnected && <ThumbnailInsightsPanel clipIndex={clip.index} />}
        </div>
      </div>
    </div>
  );
}
