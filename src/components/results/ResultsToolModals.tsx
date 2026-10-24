'use client';

import ResultsModal, { ModalCloseButton } from './ResultsModal';
import { copyToClipboard } from './hooks/useResultsActions';
import { downloadQuoteGraphic } from '@/lib/results/quoteGraphic';
import type { AnalysisClip, CarouselData } from '@/lib/results/types';
import toast from 'react-hot-toast';

/*
 * The "Expand your ministry" tool modals. Kept in one module so the results
 * page can load them on demand in a single chunk.
 */

const headerRow = (padding: string, border: string) =>
  ({
    padding,
    borderBottom: `1px solid ${border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexShrink: 0,
  }) as const;

export function YouTubeDescriptionModal({
  summary,
  isMobile,
  onClose,
}: {
  summary: string | undefined;
  isMobile: boolean;
  onClose: () => void;
}) {
  return (
    <ResultsModal onClose={onClose} isMobile={isMobile} backdropBlur={30} panelStyle={{ maxWidth: 640 }}>
      {(titleId) => (
        <>
          <div style={headerRow('32px', 'rgba(255,255,255,0.05)')}>
            <div>
              <div className="vesper-badge badge-violet" style={{ marginBottom: 8 }}>
                SEO ENGINE
              </div>
              <h2 id={titleId} style={{ fontSize: 24, fontWeight: 900 }}>
                YouTube Strategy
              </h2>
            </div>
            <ModalCloseButton onClose={onClose} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="glass-card" style={{ padding: 24, background: 'rgba(255,255,255,0.03)' }}>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: 'var(--primary)',
                  marginBottom: 12,
                  letterSpacing: '0.1em',
                }}
              >
                OPTIMIZED DESCRIPTION
              </h3>
              <p style={{ fontSize: 15, color: '#fff', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 20 }}>
                {summary || 'Processing...'}
              </p>
              <button
                type="button"
                onClick={() => copyToClipboard(summary || '', 'Description copied!')}
                className="vesper-btn vesper-btn-outline"
                style={{ width: '100%' }}
              >
                COPY DESCRIPTION
              </button>
            </div>
          </div>
        </>
      )}
    </ResultsModal>
  );
}

export function QuoteVaultModal({
  clips,
  sermonTitle,
  isMobile,
  onClose,
}: {
  clips: AnalysisClip[] | undefined;
  sermonTitle: string | undefined;
  isMobile: boolean;
  onClose: () => void;
}) {
  return (
    <ResultsModal
      onClose={onClose}
      isMobile={isMobile}
      backdropOpacity={0.92}
      backdropBlur={20}
      panelClassName="glass-panel animate-up"
      panelStyle={{
        maxWidth: isMobile ? '100%' : 800,
        maxHeight: isMobile ? '100%' : '85vh',
        borderRadius: isMobile ? 0 : 32,
        border: isMobile ? 'none' : '1px solid rgba(139,92,246,0.25)',
      }}
    >
      {(titleId) => (
        <>
          <div style={headerRow('32px 32px 24px', 'rgba(255,255,255,0.07)')}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.2em', marginBottom: 6 }}>
                EXPAND YOUR MINISTRY
              </div>
              <h2 id={titleId} style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em' }}>
                Quote Vault
              </h2>
              <p style={{ color: '#A1A1AA', fontSize: 18, marginTop: 4 }}>
                Auto-generated 1080x1080 graphics for Instagram Stories.
              </p>
            </div>
            <ModalCloseButton onClose={onClose} />
          </div>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 32,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 24,
            }}
          >
            {clips?.map((clip, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ fontSize: 17, fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.1em', marginBottom: 12 }}>
                  CLIP {i + 1}
                </div>
                <p style={{ flex: 1, marginBottom: 20, fontStyle: 'italic', fontSize: 18, lineHeight: 1.5, color: '#E4E4E7' }}>
                  &ldquo;{clip.main_quote}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (downloadQuoteGraphic(clip.main_quote || '', sermonTitle, i)) {
                      toast.success('Quote Graphic Downloaded! 📸');
                    }
                  }}
                  className="vesper-btn vesper-btn-outline"
                  style={{ width: '100%' }}
                >
                  DOWNLOAD GRAPHIC
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </ResultsModal>
  );
}

export function CarouselModal({ data, onClose }: { data: CarouselData; onClose: () => void }) {
  return (
    <ResultsModal
      onClose={onClose}
      backdropBlur={20}
      panelClassName="animate-up glass-panel"
      panelStyle={{ maxWidth: 860, border: '1px solid rgba(139, 92, 246, 0.3)' }}
    >
      {(titleId) => (
        <div style={{ padding: 48, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <h2
              id={titleId}
              style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase' }}
            >
              Kingdom <span style={{ color: '#8B5CF6' }}>Carousel</span>
            </h2>
            <ModalCloseButton onClose={onClose} />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
              marginBottom: 40,
            }}
          >
            {data.slides.map((slide) => (
              <div
                key={slide.slide_number}
                className="glass-panel"
                style={{ padding: 28, background: 'rgba(255,255,255,0.03)' }}
              >
                <div style={{ fontSize: 15, color: '#8B5CF6', fontWeight: 900, marginBottom: 12, letterSpacing: '0.2em' }}>
                  SLIDE {slide.slide_number}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>{slide.heading}</h3>
                <p style={{ fontSize: 15, color: '#A1A1AA', lineHeight: 1.6 }}>{slide.content}</p>
              </div>
            ))}
          </div>
          <div
            className="glass-panel"
            style={{ padding: 32, background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)' }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 14, color: '#8B5CF6', letterSpacing: '0.2em' }}>
              OPTIMIZED CAPTION
            </h3>
            <p style={{ fontSize: 16, color: '#fff', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{data.post_caption}</p>
            <button
              type="button"
              onClick={() => copyToClipboard(data.post_caption, 'Caption copied!')}
              className="shimmer-btn"
              style={{ marginTop: 24, padding: '14px 28px', fontSize: 16 }}
            >
              COPY CAPTION
            </button>
          </div>
        </div>
      )}
    </ResultsModal>
  );
}
