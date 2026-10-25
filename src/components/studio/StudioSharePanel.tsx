'use client';

import { useState } from 'react';
import HelpInlineLink from '@/components/help/HelpInlineLink';
import HelpTooltip from '@/components/help/HelpTooltip';
import ShareExportModal from '@/components/dashboard/ShareExportModal';
import { HELP_TOOLTIPS } from '@/lib/helpTooltips';
import { copyToClipboard } from '@/lib/clipboard';
import { STUDIO_PLATFORMS } from '@/lib/studio/constants';
import { buildPlatformCaption } from '@/lib/studio/studioLogic';
import type { RenderState } from '@/lib/studio/types';
import { Disclosure } from './StudioControls';
import StudioClipAnalyticsPanel from './StudioClipAnalyticsPanel';
import InspirationPanel from './InspirationPanel';

type Props = {
  renderState?: RenderState;
  renderProgress: number;
  isYouTubeSource: boolean;
  clipTitle: string;
  clipId: string | null;
  caption: string;
  platformId: string;
  onPlatform: (id: string) => void;
  topQuote?: string;
  hook?: string;
  youtubeConnected: boolean;
  isPublishing: boolean;
  onExport: () => void;
  onDownload: () => void;
  onPublishYouTube: () => void;
};

export default function StudioSharePanel({
  renderState,
  renderProgress,
  isYouTubeSource,
  clipTitle,
  clipId,
  caption,
  platformId,
  onPlatform,
  topQuote,
  hook,
  youtubeConnected,
  isPublishing,
  onExport,
  onDownload,
  onPublishYouTube,
}: Props) {
  const [showShare, setShowShare] = useState(false);
  const post = buildPlatformCaption(platformId, caption, topQuote);

  const status = renderState?.status;
  const renderUrl = renderState?.url;
  const isComplete = status === 'complete' && Boolean(renderUrl);

  return (
    <div className="studio-share">
      {/* Export status */}
      <section className={`studio-card studio-export-card${isComplete ? ' is-ready' : ''}`} aria-labelledby="studio-export-title">
        <h2 id="studio-export-title" className="studio-card-title">
          {isComplete ? 'Your reel is ready' : 'Export'}
        </h2>

        {isYouTubeSource ? (
          <p className="studio-muted">
            This clip came from a YouTube link, so it can be previewed but not exported. Upload the sermon&rsquo;s MP4
            to export reels.{' '}
            <HelpInlineLink slug="youtube-export-limitation" label="Why?" className="help-inline-link help-inline-link--inline" />
          </p>
        ) : status === 'loading' ? (
          <>
            <div className="studio-progress" role="progressbar" aria-valuenow={renderProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Export progress">
              <span style={{ width: `${renderProgress}%` }} />
            </div>
            <p className="studio-muted">
              Rendering in the cloud, usually a minute or two. Changes you make now won&rsquo;t be in this export.
            </p>
          </>
        ) : isComplete ? (
          <>
            <p className="studio-muted">A 9:16 MP4 with your captions, color and branding built in.</p>
            <div className="studio-card-actions">
              <button type="button" className="vesper-btn studio-gold-btn" onClick={onDownload}>
                Download
              </button>
              <button type="button" className="vesper-btn vesper-btn-outline" onClick={() => setShowShare(true)}>
                Share
              </button>
            </div>
            <div className="studio-card-links">
              <button type="button" className="studio-link-btn" onClick={() => copyToClipboard(renderUrl!, 'Video link copied')}>
                Copy video link
              </button>
              <button type="button" className="studio-link-btn" onClick={onExport}>
                Export again with changes
              </button>
            </div>
          </>
        ) : status === 'error' ? (
          <div role="alert">
            <p className="studio-error-text">{renderState?.error || 'The export didn’t finish.'}</p>
            <div className="studio-card-links">
              <button type="button" className="studio-link-btn" onClick={onExport}>
                Try again
              </button>
              <HelpInlineLink slug="export-failed" label="Export troubleshooting" />
            </div>
          </div>
        ) : (
          <p className="studio-muted">
            When the preview looks right, use <strong>Export reel</strong> at the top. Captions, color, music and
            branding are built into the video.
            <HelpTooltip content={HELP_TOOLTIPS.burnCaptions} label="About burned-in captions" />
          </p>
        )}
      </section>

      {/* Post caption */}
      <section className="studio-card" aria-labelledby="studio-post-title">
        <h2 id="studio-post-title" className="studio-card-title">
          Post caption
          <HelpTooltip content={HELP_TOOLTIPS.socialKit} label="About post captions" />
        </h2>
        <div className="studio-segmented" role="radiogroup" aria-label="Platform">
          {STUDIO_PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={platformId === p.id}
              className={platformId === p.id ? 'is-active' : ''}
              onClick={() => onPlatform(p.id)}
            >
              {p.id === 'youtube' ? 'YouTube' : p.label}
            </button>
          ))}
        </div>
        <p className="studio-post-text">{post.text}</p>
        <p className={`studio-post-count${post.overLimit ? ' is-over' : ''}`}>
          {post.count}
          {post.limit ? ` of ${post.limit} characters` : ' characters'}
          {post.overLimit ? ` — too long for ${post.label}` : ''}
        </p>
        <div className="studio-card-actions">
          <button
            type="button"
            className="vesper-btn vesper-btn-outline"
            onClick={() => copyToClipboard(post.text, `${post.label} caption copied`)}
          >
            Copy caption
          </button>
          {platformId === 'youtube' && !isYouTubeSource && (
            <button
              type="button"
              className="vesper-btn vesper-btn-primary"
              onClick={onPublishYouTube}
              disabled={!isComplete || isPublishing}
              title={!isComplete ? 'Export the reel first' : undefined}
            >
              {isPublishing ? 'Publishing…' : youtubeConnected ? 'Publish to YouTube' : 'Connect YouTube'}
            </button>
          )}
        </div>
        {platformId === 'youtube' && !isComplete && !isYouTubeSource && (
          <p className="studio-muted">Export the reel first, then publish it straight to your channel.</p>
        )}
      </section>

      {hook && (
        <section className="studio-card" aria-labelledby="studio-hook-title">
          <h2 id="studio-hook-title" className="studio-card-title">
            Suggested opening line
          </h2>
          <p className="studio-hook">&ldquo;{hook}&rdquo;</p>
          <button type="button" className="studio-link-btn" onClick={() => copyToClipboard(hook, 'Opening line copied')}>
            Copy
          </button>
        </section>
      )}

      {clipId && (
        <section className="studio-card" aria-labelledby="studio-embed-title">
          <h2 id="studio-embed-title" className="studio-card-title">
            Share on your website
          </h2>
          <p className="studio-muted">A watch page for this clip that you can link from your church site or app.</p>
          <button
            type="button"
            className="studio-link-btn"
            onClick={() =>
              copyToClipboard(`${window.location.origin}/watch/${encodeURIComponent(clipId)}`, 'Watch link copied')
            }
          >
            Copy watch link
          </button>
        </section>
      )}

      {clipId && (
        <Disclosure title="How this clip is doing" hint="Views and engagement after you post">
          {() => <StudioClipAnalyticsPanel clipId={clipId} clipTitle={clipTitle} />}
        </Disclosure>
      )}

      <Disclosure title="Ideas from other creators" hint="Popular short-form posts, for inspiration">
        {() => <InspirationPanel />}
      </Disclosure>

      {showShare && renderUrl && (
        <ShareExportModal clipTitle={clipTitle} renderUrl={renderUrl} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}
