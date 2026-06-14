'use client';
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { CSSProperties } from 'react';
import toast from 'react-hot-toast';
import HelpTooltip from '@/components/help/HelpTooltip';
import { HELP_TOOLTIPS } from '@/lib/helpTooltips';
import { triggerReelDownload } from '@/lib/reelDownload';
import { SITE_URL } from '@/lib/siteConfig';
import type { ThumbnailState } from './ThumbnailStudioModal';

type Platform = {
  id: string;
  label: string;
  icon: string;
  prefix: string;
};

interface ClipActionBarProps {
  clip: any;
  jobId?: string;
  isMobile: boolean;
  isYouTubeSource: boolean;
  platforms: Platform[];
  captionOpen: boolean;
  onToggleCaption: () => void;
  thumbnail?: ThumbnailState;
  renderStatus?: string;
  renderProgress?: number;
  renderUrl?: string;
  onOpenThumbnail: () => void;
  onOpenQuoteCard?: () => void;
  onOpenNewsletterEmbed?: () => void;
  topQuote?: string;
  onCustomize: () => void;
}

const btnBase: CSSProperties = {
  padding: '11px 12px',
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.08em',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  minHeight: '44px',
};

export default function ClipActionBar({
  clip,
  jobId,
  isMobile,
  isYouTubeSource,
  platforms,
  captionOpen,
  onToggleCaption,
  thumbnail,
  renderStatus,
  renderProgress = 0,
  renderUrl,
  onOpenThumbnail,
  onOpenQuoteCard,
  onOpenNewsletterEmbed,
  topQuote,
  onCustomize,
}: ClipActionBarProps) {
  const hasThumbnail = thumbnail?.status === 'done' && thumbnail?.url;

  const copyCaption = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} caption copied`);
    onToggleCaption();
  };

  return (
    <div
      style={{
        marginTop: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '10px',
          position: 'relative',
          zIndex: captionOpen ? 40 : 1,
        }}
      >
        <div style={{ position: 'relative', zIndex: captionOpen ? 50 : 'auto' }}>
          <button
            type="button"
            onClick={onToggleCaption}
            className="vesper-btn-outline"
            style={{
              ...btnBase,
              width: '100%',
              justifyContent: 'space-between',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              CAPTION
              <HelpTooltip content={HELP_TOOLTIPS.socialKit} label="About Social Kit" />
            </span>
            <span style={{ opacity: 0.5, fontSize: '10px' }}>{captionOpen ? '▲' : '▼'}</span>
          </button>
          {captionOpen && (
            <div
              className="glass-card"
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                zIndex: 200,
                padding: '6px',
                borderRadius: '14px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.65)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                background: 'rgba(12, 12, 18, 0.98)',
              }}
            >
              {!clip.suggested_captions?.length && !clip.main_quote ? (
                <div style={{ padding: '16px', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                    No Social Kit captions yet
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Captions appear here after AI analysis completes.
                  </p>
                </div>
              ) : (
                platforms.map((p, pi) => {
                  const caption =
                    clip.suggested_captions?.[pi] || clip.suggested_captions?.[0] || clip.main_quote || '';
                  const body = topQuote && !caption.startsWith(topQuote) ? `"${topQuote}"\n\n${caption}` : caption;
                  const text = `${p.prefix}${body}`;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => copyCaption(text, p.label)}
                      className="vesper-btn-outline"
                      style={{
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        justifyContent: 'flex-start',
                        padding: '10px 12px',
                        fontSize: '12px',
                        gap: '10px',
                      }}
                    >
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenThumbnail}
          className="vesper-btn-outline"
          style={{
            ...btnBase,
            width: '100%',
            background: hasThumbnail
              ? 'rgba(139,92,246,0.12)'
              : 'linear-gradient(135deg, rgba(244,185,66,0.12), rgba(244,185,66,0.04))',
            color: hasThumbnail ? 'var(--primary)' : '#F4B942',
            borderColor: hasThumbnail ? 'rgba(139,92,246,0.35)' : 'rgba(244,185,66,0.35)',
            overflow: 'hidden',
            padding: hasThumbnail ? 0 : btnBase.padding,
          }}
        >
          {hasThumbnail ? (
            <img
              src={`/api/proxy-image?url=${encodeURIComponent(thumbnail.url!)}`}
              alt="Generated clip thumbnail"
              style={{ width: '100%', height: '44px', objectFit: 'cover' }}
            />
          ) : (
            <>
              <span aria-hidden>🎨</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                THUMBNAIL
                <HelpTooltip content={HELP_TOOLTIPS.thumbnailStudio} label="About Thumbnail Studio" />
              </span>
            </>
          )}
        </button>
      </div>

      {renderStatus === 'loading' && (
        <div>
          <div
            style={{
              height: '4px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '99px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${renderProgress}%`,
                background: 'var(--primary)',
                boxShadow: '0 0 10px var(--primary)',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {jobId && (
          <button
            type="button"
            onClick={() => {
              const clipId = `${jobId}-${clip.index ?? 0}`;
              const code = `<iframe src="${SITE_URL}/embed/${clipId}" width="315" height="560" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
              navigator.clipboard.writeText(code);
              toast.success('Embed code copied');
            }}
            className="vesper-btn-outline"
            style={{ ...btnBase, width: '100%', marginBottom: 10, fontSize: '11px' }}
          >
            GET EMBED CODE
          </button>
        )}
        {onOpenNewsletterEmbed && (
          <button
            type="button"
            onClick={onOpenNewsletterEmbed}
            className="vesper-btn-outline"
            style={{ ...btnBase, width: '100%', marginBottom: 10, fontSize: '11px' }}
          >
            NEWSLETTER EMBED
          </button>
        )}
        {onOpenQuoteCard && (
          <button
            type="button"
            onClick={onOpenQuoteCard}
            className="vesper-btn-outline"
            style={{ ...btnBase, width: '100%', marginBottom: 10, fontSize: '12px' }}
          >
            EXPORT QUOTE CARD
          </button>
        )}
        {renderStatus === 'complete' && renderUrl ? (
          <button
            type="button"
            onClick={() => {
              triggerReelDownload(renderUrl, clip.hook_title || clip.main_quote || `clip-${clip.index + 1}`);
              toast.success('Download started');
            }}
            className="vesper-btn vesper-btn-primary shimmer-effect"
            style={{
              ...btnBase,
              width: '100%',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              fontSize: '12px',
            }}
          >
            DOWNLOAD REEL
          </button>
        ) : (
          <button
            type="button"
            onClick={onCustomize}
            className={
              isYouTubeSource ? 'vesper-btn-outline' : 'vesper-btn vesper-btn-primary shimmer-effect'
            }
            style={{
              ...btnBase,
              width: '100%',
              fontSize: '12px',
              ...(isYouTubeSource ? { color: 'var(--primary)', borderColor: 'var(--primary-glow)' } : {}),
            }}
          >
            {isYouTubeSource ? 'PREVIEW IN STUDIO' : 'CUSTOMIZE REEL'}
          </button>
        )}
      </div>
    </div>
  );
}
