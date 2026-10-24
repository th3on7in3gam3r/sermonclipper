'use client';

import ClipActionBar from './ClipActionBar';
import ClipPreviewVideo, { clipDurationLabel } from './ClipPreviewVideo';
import HelpTooltip from '@/components/help/HelpTooltip';
import { HELP_TOOLTIPS } from '@/lib/helpTooltips';
import { parseTime } from '@/lib/parseTime';
import { CAPTION_PLATFORMS } from '@/lib/results/helpers';
import type { RenderState } from '@/lib/studio/types';
import type { AnalysisClip, ThumbnailEntry } from '@/lib/results/types';

type Props = {
  clip: AnalysisClip;
  index: number;
  jobId: string | null;
  isMobile: boolean;
  isAudioSource: boolean;
  /** YouTube id when the source is YouTube (preview via embed, no export). */
  videoId: string | null;
  hasVideoSource: boolean;
  playableVideoUrl: string | null;
  onRefreshPlayableUrl: () => Promise<string | null>;
  captionOpen: boolean;
  onToggleCaption: () => void;
  thumbnail?: ThumbnailEntry;
  render?: RenderState;
  renderProgress?: number;
  topQuote?: string;
  onOpenThumbnail: () => void;
  onOpenQuoteCard: () => void;
  onOpenNewsletterEmbed: () => void;
  onCustomize: () => void;
};

const overlayBadge = {
  position: 'absolute',
  top: 16,
  zIndex: 10,
  backdropFilter: 'blur(8px)',
} as const;

export default function ClipCard({
  clip,
  index,
  jobId,
  isMobile,
  isAudioSource,
  videoId,
  hasVideoSource,
  playableVideoUrl,
  onRefreshPlayableUrl,
  captionOpen,
  onToggleCaption,
  thumbnail,
  render,
  renderProgress,
  topQuote,
  onOpenThumbnail,
  onOpenQuoteCard,
  onOpenNewsletterEmbed,
  onCustomize,
}: Props) {
  const start = clip.start ?? clip.start_time;
  const end = clip.end ?? clip.end_time;

  return (
    <article className="glass-card clip-card">
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000', overflow: 'hidden', borderRadius: 'inherit' }}>
        {videoId ? (
          <iframe
            title={clip.hook_title || `Clip ${index + 1} preview`}
            loading="lazy"
            style={{ width: '100%', height: '100%', border: 'none' }}
            src={`https://www.youtube.com/embed/${videoId}?start=${parseTime(clip.start)}&end=${parseTime(clip.end)}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : hasVideoSource ? (
          playableVideoUrl ? (
            <ClipPreviewVideo src={playableVideoUrl} start={start} end={end} onRefreshSrc={onRefreshPlayableUrl} />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-dim)',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Loading preview…
            </div>
          )
        ) : null}

        <div className="vesper-badge" style={{ ...overlayBadge, left: 16, background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
          Clip {index + 1}
          {(clip.is_audio || isAudioSource) && (
            <span className="clip-badge-audio" style={{ marginLeft: 8 }}>
              🎙️ Audio
            </span>
          )}
        </div>

        {clip.viral_score ? (
          <div
            className="vesper-badge media-badge"
            style={{ ...overlayBadge, right: 16, display: 'inline-flex', alignItems: 'center', gap: 2 }}
          >
            Impact {clip.viral_score}
            <HelpTooltip content={HELP_TOOLTIPS.impactScore} label="About the impact score" />
          </div>
        ) : null}

        <div
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 800,
            backdropFilter: 'blur(8px)',
            fontFamily: 'monospace',
          }}
        >
          {clipDurationLabel(start, end)}
        </div>
      </div>

      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 className="clip-card-title">{clip.hook_title}</h3>
        <blockquote className="clip-card-quote">&ldquo;{clip.main_quote}&rdquo;</blockquote>

        <ClipActionBar
          clip={clip}
          jobId={jobId || undefined}
          isMobile={isMobile}
          isYouTubeSource={Boolean(videoId)}
          platforms={CAPTION_PLATFORMS}
          captionOpen={captionOpen}
          onToggleCaption={onToggleCaption}
          thumbnail={thumbnail}
          renderStatus={render?.status}
          renderProgress={renderProgress}
          renderUrl={render?.url}
          onOpenThumbnail={onOpenThumbnail}
          onOpenQuoteCard={onOpenQuoteCard}
          onOpenNewsletterEmbed={onOpenNewsletterEmbed}
          topQuote={topQuote}
          onCustomize={onCustomize}
        />
      </div>
    </article>
  );
}
