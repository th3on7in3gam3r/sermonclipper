'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import SermonContextCard from '@/components/results/SermonContextCard';
import SermonNotesEditor from '@/components/results/SermonNotesEditor';
import ClipCard from '@/components/results/ClipCard';
import ResultsHeader from '@/components/results/ResultsHeader';
import ResultsHero, { ToolCard } from '@/components/results/ResultsHero';
import SiteFooter from '@/components/layout/SiteFooter';
import ShowcasePromo from '@/components/showcase/ShowcasePromo';
import HelpTooltip from '@/components/help/HelpTooltip';
import EmptyState from '@/components/shared/EmptyState';
import { HELP_TOOLTIPS } from '@/lib/helpTooltips';
import { UPGRADE_COPY } from '@/lib/plans';
import { parseTime } from '@/lib/parseTime';
import type { IndexedClip } from '@/lib/results/types';
import { useIsMobile } from '@/components/results/hooks/useIsMobile';
import { useResultsSession } from '@/components/results/hooks/useResultsSession';
import { usePlayableVideo } from '@/components/results/hooks/usePlayableVideo';
import { useClipRendering } from '@/components/results/hooks/useClipRendering';
import { useThumbnailStudio } from '@/components/results/hooks/useThumbnailStudio';
import { copyToClipboard, useMasterDownload, useSocialCarousel } from '@/components/results/hooks/useResultsActions';

// Heavy, interaction-only UI is split out of the initial bundle.
const VesperStudio = dynamic(() => import('@/components/studio/VesperStudio'), { ssr: false });
const ThumbnailStudioModal = dynamic(() => import('@/components/results/ThumbnailStudioModal'), { ssr: false });
const QuoteCardModal = dynamic(() => import('@/components/results/QuoteCardModal'), { ssr: false });
const NewsletterEmbedModal = dynamic(() => import('@/components/results/NewsletterEmbedModal'), { ssr: false });
const UpgradePromptModal = dynamic(() => import('@/components/shared/UpgradePromptModal'), { ssr: false });
const VesperTour = dynamic(() => import('@/components/VesperTour'), { ssr: false });
const YouTubeDescriptionModal = dynamic(
  () => import('@/components/results/ResultsToolModals').then((m) => m.YouTubeDescriptionModal),
  { ssr: false }
);
const QuoteVaultModal = dynamic(
  () => import('@/components/results/ResultsToolModals').then((m) => m.QuoteVaultModal),
  { ssr: false }
);
const CarouselModal = dynamic(() => import('@/components/results/ResultsToolModals').then((m) => m.CarouselModal), {
  ssr: false,
});

const FALLBACK_ORIGIN = 'https://vesper.biblefunland.com';

export default function ResultsView() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const clipParam = searchParams.get('clip');
  const { isLoaded, userId } = useAuth();
  const isMobile = useIsMobile();

  const session = useResultsSession({
    jobId,
    userId,
    videoUrl: searchParams.get('videoUrl'),
    finalPathParam: searchParams.get('finalPath'),
  });
  const { analysis, userStatus, clipCount, sessionVideoSource, videoId, isYouTubeSource } = session;
  const clips = analysis?.clips;

  const { playableVideoUrl, refreshPlayableUrl } = usePlayableVideo(sessionVideoSource, isLoaded, userId);

  const [upgradePrompt, setUpgradePrompt] = useState<keyof typeof UPGRADE_COPY | null>(null);
  const requireUpgrade = useCallback(() => setUpgradePrompt('export'), [setUpgradePrompt]);

  const renderer = useClipRendering({
    jobId,
    clips,
    sourceUrl: session.masterDownloadUrl || session.effectiveVideoUrl,
    userStatus,
    isYouTubeSource,
    onUpgradeRequired: requireUpgrade,
  });
  const thumbs = useThumbnailStudio();
  const carousel = useSocialCarousel(jobId);
  const master = useMasterDownload(session.masterDownloadUrl);

  const [selectedClip, setSelectedClip] = useState<IndexedClip | null>(null);
  const [showYTDesc, setShowYTDesc] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showQuoteVault, setShowQuoteVault] = useState(false);
  const [openCaptionIdx, setOpenCaptionIdx] = useState<number | null>(null);
  const [activeQuoteClip, setActiveQuoteClip] = useState<IndexedClip | null>(null);
  const [newsletterClip, setNewsletterClip] = useState<{ index: number; title: string } | null>(null);

  // Arriving from the dashboard with ?clip=N opens Vesper Studio on that clip
  // (once; afterwards the user's own open/close wins).
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);
  if (!deepLinkHandled && clips?.length && clipParam != null) {
    const idx = Number.parseInt(clipParam, 10);
    setDeepLinkHandled(true);
    if (!Number.isNaN(idx) && idx >= 0 && clips[idx]) setSelectedClip({ ...clips[idx], index: idx });
  }

  const topQuote = analysis?.quotable_moments?.[0]?.text;
  const origin = typeof window !== 'undefined' ? window.location.origin : FALLBACK_ORIGIN;

  return (
    <div className="vesper-mesh-bg-container" style={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
      <div className="vesper-mesh-bg" />

      <ResultsHeader
        isMobile={isMobile}
        signedIn={Boolean(isLoaded && userId)}
        userStatus={userStatus}
        onOpenTour={() => setShowTour(true)}
      />

      <div style={{ paddingTop: 120, paddingBottom: 100 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '0 16px' : '0 40px' }}>
          <ResultsHero
            isMobile={isMobile}
            isYouTubeSource={isYouTubeSource}
            sermonTitle={analysis?.sermon_title}
            mainTheme={analysis?.main_theme}
            onBatchExport={renderer.batchExport}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(400px, 1fr))',
              gap: 32,
            }}
          >
            <SermonContextCard
              summary={analysis?.summary}
              videoUrl={sessionVideoSource}
              playableVideoUrl={playableVideoUrl}
              videoId={videoId}
              masterDownloadUrl={session.masterDownloadUrl}
              isMobile={isMobile}
              isDownloadingMaster={master.isDownloading}
              onCopyLink={() => copyToClipboard(window.location.href, 'Session link copied to clipboard!')}
              onOpenDescription={() => setShowYTDesc(true)}
              onDownloadMaster={master.download}
            />

            {jobId && <SermonNotesEditor jobId={jobId} />}

            {clipCount > 0 ? (
              <>
                <div style={{ gridColumn: '1 / -1' }}>
                  <ShowcasePromo variant="member" />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.12em', margin: 0 }}>NEURAL SELECTION</h2>
                  <HelpTooltip content={HELP_TOOLTIPS.neuralSelection} label="About Neural Selection" />
                </div>
                {clips!.map((clip, i) => (
                  <ClipCard
                    key={i}
                    clip={clip}
                    index={i}
                    jobId={jobId}
                    isMobile={isMobile}
                    isAudioSource={analysis?.source_type === 'audio'}
                    videoId={videoId}
                    hasVideoSource={Boolean(sessionVideoSource)}
                    playableVideoUrl={playableVideoUrl}
                    onRefreshPlayableUrl={refreshPlayableUrl}
                    captionOpen={openCaptionIdx === i}
                    onToggleCaption={() => setOpenCaptionIdx(openCaptionIdx === i ? null : i)}
                    thumbnail={thumbs.thumbnails[i]}
                    render={renderer.rendering[i]}
                    renderProgress={renderer.renderProgress[i]}
                    topQuote={topQuote}
                    onOpenThumbnail={() => thumbs.open(clip, i)}
                    onOpenQuoteCard={() => setActiveQuoteClip({ ...clip, index: i })}
                    onOpenNewsletterEmbed={() =>
                      setNewsletterClip({ index: i, title: clip.hook_title || clip.main_quote || 'Sermon clip' })
                    }
                    onCustomize={() => setSelectedClip({ ...clip, index: i })}
                  />
                ))}
              </>
            ) : (
              <div
                role="status"
                style={{ gridColumn: '1/-1', textAlign: 'center', padding: 100, color: 'var(--text-muted)' }}
              >
                <div style={{ fontSize: 40, marginBottom: 24, animation: 'pulse 2s infinite' }} aria-hidden>
                  ◈
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '0.1em' }}>ESTABLISHING NEURAL LINK...</div>
              </div>
            )}
          </div>

          {clipCount > 0 && !thumbs.hasAnyThumbnail && (
            <EmptyState
              icon="🖼️"
              headline="No thumbnails generated"
              subtext="Open Thumbnail Studio on any clip to create a 16:9 YouTube billboard with AI."
              ctaLabel="Create Thumbnail"
              onCtaClick={() => thumbs.open(clips![0], 0)}
            />
          )}

          {!isYouTubeSource && clipCount > 0 && renderer.completedExportCount === 0 && (
            <EmptyState
              icon="📥"
              headline="No exports yet"
              subtext="Customize a clip in Studio and render your first cinematic 9:16 reel for social media."
              ctaLabel="Customize Your First Reel"
              onCtaClick={() => setSelectedClip({ ...clips![0], index: 0 })}
            />
          )}

          <section className="animate-in" style={{ marginTop: 120, marginBottom: 100, textAlign: 'center' }}>
            <h2 className="title-xl" style={{ fontSize: 'clamp(32px, 5vw, 48px)', marginBottom: 60 }}>
              EXPAND YOUR <span className="accent-text">MINISTRY</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
              <ToolCard
                title="Social Carousel"
                desc="Neural-generated multi-slide series."
                onClick={carousel.generate}
                loading={carousel.loading}
                icon="📱"
              />
              <ToolCard
                title="Quote Vault"
                desc="Transform powerful sermon quotes."
                onClick={() => setShowQuoteVault(true)}
                icon="💎"
              />
              <ToolCard
                title="YouTube Description"
                desc="AI-optimized metadata."
                onClick={() => setShowYTDesc(true)}
                icon="📝"
              />
            </div>
          </section>
          <SiteFooter />
        </div>

        {upgradePrompt && (
          <UpgradePromptModal
            open
            feature={UPGRADE_COPY[upgradePrompt].feature}
            planName={UPGRADE_COPY[upgradePrompt].plan}
            price={UPGRADE_COPY[upgradePrompt].price}
            onClose={() => setUpgradePrompt(null)}
          />
        )}

        {carousel.open && carousel.data && <CarouselModal data={carousel.data} onClose={carousel.close} />}

        {showYTDesc && (
          <YouTubeDescriptionModal summary={analysis?.summary} isMobile={isMobile} onClose={() => setShowYTDesc(false)} />
        )}

        {showQuoteVault && (
          <QuoteVaultModal
            clips={clips}
            sermonTitle={analysis?.sermon_title}
            isMobile={isMobile}
            onClose={() => setShowQuoteVault(false)}
          />
        )}

        {thumbs.activeClip && (
          <ThumbnailStudioModal
            clip={{ ...thumbs.activeClip, start: String(thumbs.activeClip.start), end: String(thumbs.activeClip.end) }}
            videoSrc={playableVideoUrl || sessionVideoSource}
            isMobile={isMobile}
            thumbPrompt={thumbs.prompt}
            onThumbPromptChange={thumbs.setPrompt}
            thumbStyle={thumbs.style}
            onThumbStyleChange={thumbs.setStyle}
            isGenerating={thumbs.isGenerating}
            thumbnail={thumbs.thumbnails[thumbs.activeClip.index]}
            selectedVariantIdx={thumbs.selectedVariantIdx}
            onSelectVariant={thumbs.setSelectedVariantIdx}
            onClose={thumbs.close}
            onGenerate={thumbs.generate}
            youtubeConnected={Boolean(userStatus?.youtubeConnected)}
            clipStartSec={parseTime(thumbs.activeClip.start || '0')}
            clipEndSec={
              parseTime(thumbs.activeClip.end || '0') || parseTime(thumbs.activeClip.start || '0') + 60
            }
            onSetReelCover={(url) => thumbs.setReelCover(thumbs.activeClip!.index, url)}
          />
        )}

        {newsletterClip && jobId && (
          <NewsletterEmbedModal
            watchUrl={`${origin}/watch/${encodeURIComponent(`${jobId}:${newsletterClip.index}`)}`}
            thumbnailUrl={
              thumbs.thumbnails[newsletterClip.index]?.url
                ? `${origin}/api/proxy-image?url=${encodeURIComponent(thumbs.thumbnails[newsletterClip.index]!.url!)}`
                : `${origin}/opengraph-image`
            }
            title={newsletterClip.title}
            durationLabel={
              clips?.[newsletterClip.index]
                ? `${Math.round(parseTime(clips[newsletterClip.index].end) - parseTime(clips[newsletterClip.index].start))}s`
                : undefined
            }
            onClose={() => setNewsletterClip(null)}
          />
        )}

        {activeQuoteClip && (
          <QuoteCardModal
            quote={activeQuoteClip.main_quote || activeQuoteClip.hook_title || ''}
            speaker={analysis?.speaker}
            church={analysis?.church_name}
            onClose={() => setActiveQuoteClip(null)}
          />
        )}

        {selectedClip && (
          <VesperStudio
            key={selectedClip.index}
            selectedClip={selectedClip}
            onClose={() => setSelectedClip(null)}
            videoId={videoId}
            videoUrl={sessionVideoSource}
            playableVideoUrl={playableVideoUrl}
            jobId={jobId}
            rendering={renderer.rendering}
            renderProgress={renderer.renderProgress}
            startExport={renderer.startExport}
            isMobile={isMobile}
            userStatus={userStatus}
            isYouTubeSource={isYouTubeSource}
            quotableMoments={analysis?.quotable_moments || []}
            onOpenQuoteCard={(quote) => setActiveQuoteClip({ ...selectedClip, main_quote: quote })}
          />
        )}
        <VesperTour forceOpen={showTour} onClose={() => setShowTour(false)} />
      </div>
    </div>
  );
}
