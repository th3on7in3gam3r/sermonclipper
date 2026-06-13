'use client';
/* eslint-disable @next/next/no-img-element */

import { THUMB_STYLES, type ThumbStyleId } from '@/lib/thumbnailStyles';

export type ThumbnailState = {
  status: string;
  url?: string;
  variants?: string[];
};

interface ThumbnailStudioModalProps {
  clip: { hook_title?: string; main_quote?: string; index: number };
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
}

function proxyImageUrl(url: string) {
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

export default function ThumbnailStudioModal({
  clip,
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
}: ThumbnailStudioModalProps) {
  const variants = thumbnail?.variants?.length ? thumbnail.variants : thumbnail?.url ? [thumbnail.url] : [];
  const activeUrl = variants[selectedVariantIdx] || variants[0];
  const isLoading = isGenerating || thumbnail?.status === 'loading';

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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(30px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '0' : '32px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card animate-in premium-border"
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: isMobile ? '100%' : '92vh',
          height: isMobile ? '100%' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: isMobile ? '0' : '28px',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: isMobile ? '20px' : '28px 32px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div className="vesper-badge badge-violet" style={{ marginBottom: '8px' }}>
              VISUAL HARVEST
            </div>
            <h2 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 900, marginBottom: '6px' }}>
              Thumbnail Studio
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
              {clip.hook_title || `Clip ${clip.index + 1}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '18px',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '20px' : '28px 32px' }}>
          {clip.main_quote && (
            <p
              style={{
                fontStyle: 'italic',
                color: 'rgba(255,255,255,0.75)',
                fontSize: '15px',
                lineHeight: 1.5,
                marginBottom: '20px',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              &ldquo;{clip.main_quote}&rdquo;
            </p>
          )}

          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '11px',
              fontWeight: 900,
              letterSpacing: '0.12em',
              color: '#C4B5FD',
            }}
          >
            HEADLINE ON THUMBNAIL
          </label>
          <input
            type="text"
            value={thumbPrompt}
            onChange={(e) => onThumbPromptChange(e.target.value)}
            placeholder={clip.hook_title || 'Enter overlay text…'}
            className="vesper-input"
            style={{
              width: '100%',
              marginBottom: '20px',
              padding: '14px 16px',
              fontSize: '15px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
            }}
          />

          <label
            style={{
              display: 'block',
              marginBottom: '10px',
              fontSize: '11px',
              fontWeight: 900,
              letterSpacing: '0.12em',
              color: '#C4B5FD',
            }}
          >
            VISUAL STYLE
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '10px',
              marginBottom: '24px',
            }}
          >
            {THUMB_STYLES.map((style) => {
              const selected = thumbStyle === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onThumbStyleChange(style.id)}
                  className="vesper-btn-outline"
                  style={{
                    padding: '14px 12px',
                    borderColor: selected ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)',
                    background: selected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ fontSize: '22px' }}>{style.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: 800 }}>{style.name}</span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              aspectRatio: '16/9',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#000',
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '180px',
            }}
          >
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'pulse 2s infinite' }}>
                  ◈
                </div>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                  }}
                >
                  GENERATING NEURAL THUMBNAILS…
                </p>
              </div>
            ) : activeUrl ? (
              <img
                src={proxyImageUrl(activeUrl)}
                alt="Generated thumbnail preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ padding: '24px', width: '100%' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }} aria-hidden="true">
                  🖼️
                </div>
                <p style={{ color: '#fff', fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>
                  No thumbnails generated
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>
                  Choose a style below and generate your first 16:9 YouTube billboard.
                </p>
              </div>
            )}
          </div>

          {variants.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px',
                overflowX: 'auto',
                paddingBottom: '4px',
              }}
            >
              {variants.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectVariant(idx)}
                  style={{
                    flex: '0 0 120px',
                    height: '68px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    padding: 0,
                    border: selectedVariantIdx === idx ? '2px solid #8B5CF6' : '2px solid transparent',
                    cursor: 'pointer',
                    opacity: selectedVariantIdx === idx ? 1 : 0.65,
                  }}
                >
                  <img
                    src={proxyImageUrl(url)}
                    alt={`Thumbnail variant ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          )}

          {thumbnail?.status === 'error' && (
            <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
              Generation failed. Check your API key and try again.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px' }}>
            <button
              type="button"
              onClick={onGenerate}
              disabled={isLoading}
              className="vesper-btn vesper-btn-primary shimmer-effect"
              style={{
                flex: 1,
                padding: '14px 20px',
                fontSize: '13px',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {activeUrl ? 'REGENERATE' : 'GENERATE THUMBNAILS'}
            </button>
            {activeUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="vesper-btn vesper-btn-outline"
                style={{ flex: isMobile ? undefined : '0 0 auto', padding: '14px 24px', fontSize: '13px' }}
              >
                DOWNLOAD
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
