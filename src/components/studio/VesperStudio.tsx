'use client';

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/nextjs';
import './studio.css';
import toast from 'react-hot-toast';
import { useFocusTrap } from '@/lib/useFocusTrap';
import { parseTime } from '@/lib/parseTime';
import { triggerReelDownload } from '@/lib/reelDownload';
import { loadBrandKit, migrateStoredBrandKit, saveBrandKit } from '@/lib/studio/brandKit';
import { planAllowsExport, planAllowsTemplate, UPGRADE_COPY, type UpgradeFeature } from '@/lib/plans';
import { getStudioTemplateOptions, type SeasonalTemplate } from '@/lib/seasonalTemplates';
import {
  buildExportSettings,
  defaultCaption,
  extrasFromBrandKit,
  styleFromBrandKit,
  type StyleState,
} from '@/lib/studio/studioLogic';
import type { ExportExtras } from '@/lib/studio/exportOptions';
import { STUDIO_PLATFORMS } from '@/lib/studio/constants';
import type { ExportSettings, RenderState, SermonClip, UserStatus } from '@/lib/studio/types';
import type { QuotableMoment } from '@/lib/quotes/extractQuotables';
import StudioPhonePreview from './StudioPhonePreview';
import StudioTopBar from './StudioTopBar';
import StudioTrimBar from './StudioTrimBar';
import StudioSharePanel from './StudioSharePanel';
import {
  BrandingSection,
  CaptionSection,
  MusicSection,
  StyleSection,
  type StudioSectionId,
} from './StudioEditSections';
import { useTrim } from './hooks/useTrim';
import { useStudioPlayback } from './hooks/useStudioPlayback';
import { useYouTubePublish } from './hooks/useYouTubePublish';

const UpgradePromptModal = dynamic(() => import('@/components/shared/UpgradePromptModal'), { ssr: false });

interface VesperStudioProps {
  selectedClip: SermonClip & { index: number };
  onClose: () => void;
  videoId: string | null;
  videoUrl: string | null;
  playableVideoUrl: string | null;
  jobId: string | null;
  rendering: Record<number, RenderState>;
  renderProgress: Record<number, number>;
  startExport: (clip: SermonClip & { index: number }, settings: ExportSettings) => void;
  isMobile: boolean;
  userStatus: UserStatus | null;
  isYouTubeSource: boolean;
  quotableMoments?: QuotableMoment[];
  onOpenQuoteCard?: (quote: string) => void;
}

type MobileView = 'edit' | 'preview' | 'share';

const SECTIONS: { id: StudioSectionId; labelKey: string }[] = [
  { id: 'style', labelKey: 'studio.tabs.style' },
  { id: 'caption', labelKey: 'studio.tabs.captions' },
  { id: 'music', labelKey: 'studio.tabs.audio' },
  { id: 'branding', labelKey: 'studio.tabs.branding' },
];

const MOBILE_VIEWS: { id: MobileView; labelKey: string }[] = [
  { id: 'edit', labelKey: 'studio.tabs.edit' },
  { id: 'preview', labelKey: 'studio.tabs.preview' },
  { id: 'share', labelKey: 'studio.tabs.share' },
];

const isTextEntry = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

export default function VesperStudio({
  selectedClip,
  onClose,
  videoId,
  videoUrl,
  playableVideoUrl,
  jobId,
  rendering,
  renderProgress,
  startExport,
  isMobile,
  userStatus,
  isYouTubeSource,
  quotableMoments = [],
  onOpenQuoteCard,
}: VesperStudioProps) {
  const { t } = useTranslation();
  const { isLoaded: authLoaded, userId } = useAuth();
  const titleId = useId();
  const tabIdBase = useId();
  const trapRef = useFocusTrap(true);
  const sectionTabs = useRef<(HTMLButtonElement | null)[]>([]);

  // Saved look and templates are read once from the brand kit.
  const [savedKit] = useState(() => {
    migrateStoredBrandKit();
    return loadBrandKit();
  });
  const [templateOptions] = useState(() =>
    getStudioTemplateOptions((savedKit?.customSeasonalTemplates as SeasonalTemplate[]) || [])
  );

  const [style, setStyle] = useState<StyleState>(() => styleFromBrandKit(savedKit));
  const [extras, setExtras] = useState<ExportExtras>(() => extrasFromBrandKit(savedKit));
  const [caption, setCaption] = useState(() => defaultCaption(selectedClip));
  const [section, setSection] = useState<StudioSectionId>('style');
  const [mobileView, setMobileView] = useState<MobileView>('preview');
  const [platformId, setPlatformId] = useState<string>(STUDIO_PLATFORMS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [upgradePrompt, setUpgradePrompt] = useState<UpgradeFeature | null>(null);

  const clipIndex = selectedClip.index;
  const clipId = jobId ? `${jobId}:${clipIndex}` : null;
  const clipTitle = selectedClip.hook_title || selectedClip.main_quote || 'Sermon clip';
  const renderState = rendering[clipIndex];
  const [initialCaption] = useState(caption);
  const captionOrigin =
    caption !== initialCaption
      ? 'edited'
      : selectedClip.suggested_captions?.some((c) => c?.trim())
        ? 'ai'
        : 'quote';

  const trim = useTrim(parseTime(selectedClip.start), parseTime(selectedClip.end));
  const { playbackUrl, refresh } = useStudioPlayback({ playableVideoUrl, videoUrl, videoId, authLoaded, userId });
  const youtube = useYouTubePublish({
    renderUrl: renderState?.status === 'complete' ? renderState.url : undefined,
    isYouTubeSource,
    youtubeConnected: Boolean(userStatus?.youtubeConnected),
    title: selectedClip.hook_title || 'Sermon Clip',
    description: caption,
    clipId,
    clipIndex,
  });

  const patchExtras = useCallback((patch: Partial<ExportExtras>) => setExtras((prev) => ({ ...prev, ...patch })), []);
  const patchStyle = (patch: Partial<StyleState>) => setStyle((prev) => ({ ...prev, ...patch }));

  // Start on the dialog's title (what screen readers announce) rather than the first button.
  useEffect(() => {
    document.getElementById(titleId)?.focus();
  }, [titleId]);

  // Lock page scroll behind the studio; Escape closes unless typing or a nested dialog is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const onDialogKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape' || isTextEntry(e.target)) return;
    const nested = trapRef.current?.querySelector('[role="dialog"]');
    if (nested) return;
    e.stopPropagation();
    onClose();
  };

  const handleExport = () => {
    if (isYouTubeSource) {
      toast.error('Reels from YouTube links can be previewed but not exported. Upload the MP4 to export.');
      return;
    }
    if (!planAllowsExport(userStatus?.plan) && userStatus?.isAdmin !== true) {
      setUpgradePrompt('export');
      return;
    }
    startExport(selectedClip, buildExportSettings(style, trim.trim, caption, extras));
    if (isMobile) setMobileView('share');
  };

  const handleDownload = () => {
    if (!renderState?.url) return;
    triggerReelDownload(renderState.url, clipTitle);
    toast.success('Download started');
  };

  const handleSaveDefault = () => {
    if (!userStatus?.plan || userStatus.plan === 'free') {
      setUpgradePrompt('custom_branding');
      return;
    }
    saveBrandKit({ ...style, ...extras });
    toast.success(t('studio.profileSaved'));
  };

  const onSectionKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? SECTIONS.length - 1 : (i + delta + SECTIONS.length) % SECTIONS.length;
    setSection(SECTIONS[next].id);
    sectionTabs.current[next]?.focus();
  };

  return (
    <div
      ref={trapRef}
      className="studio"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      data-view={mobileView}
      onKeyDown={onDialogKeyDown}
    >
      <StudioTopBar
        titleId={titleId}
        clipNumber={clipIndex + 1}
        clipTitle={clipTitle}
        isYouTubeSource={isYouTubeSource}
        renderState={renderState}
        renderProgress={renderProgress[clipIndex] ?? 0}
        onBack={onClose}
        onExport={handleExport}
        onDownload={handleDownload}
      />

      <div className="studio-body">
        <aside className="studio-edit" aria-label={t('studio.tabs.edit')}>
          <div className="studio-sections" role="tablist" aria-label="Edit sections">
            {SECTIONS.map((s, i) => (
              <button
                key={s.id}
                ref={(el) => {
                  sectionTabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`${tabIdBase}-tab-${s.id}`}
                aria-controls={`${tabIdBase}-panel`}
                aria-selected={section === s.id}
                tabIndex={section === s.id ? 0 : -1}
                className={section === s.id ? 'is-active' : ''}
                onClick={() => setSection(s.id)}
                onKeyDown={(e) => onSectionKeyDown(e, i)}
              >
                {t(s.labelKey)}
              </button>
            ))}
          </div>

          <div
            className="studio-edit-scroll"
            role="tabpanel"
            id={`${tabIdBase}-panel`}
            aria-labelledby={`${tabIdBase}-tab-${section}`}
            tabIndex={0}
          >
            {section === 'style' && (
              <StyleSection
                style={style}
                templateOptions={templateOptions}
                isTemplateLocked={(id) => !planAllowsTemplate(userStatus?.plan, id)}
                lockedLabel="Creator"
                onTemplate={(template) => patchStyle({ template })}
                onTemplateLocked={() => setUpgradePrompt('caption_templates')}
                onFilter={(filter) => patchStyle({ filter })}
                onFont={(font) => patchStyle({ font })}
                onAnimation={(animation) => patchStyle({ animation })}
              />
            )}
            {section === 'caption' && (
              <CaptionSection
                caption={caption}
                captionOrigin={captionOrigin}
                onCaption={setCaption}
                extras={extras}
                onExtras={patchExtras}
                quotes={quotableMoments}
                onPreviewQuote={trim.previewFrom}
                onQuoteCard={onOpenQuoteCard}
              />
            )}
            {section === 'music' && <MusicSection extras={extras} onExtras={patchExtras} />}
            {section === 'branding' && <BrandingSection extras={extras} onExtras={patchExtras} />}
          </div>

          <div className="studio-edit-footer">
            <button type="button" className="vesper-btn vesper-btn-outline" onClick={handleSaveDefault}>
              Save as my default
            </button>
            <p className="studio-muted">New clips will start with this look and branding.</p>
          </div>
        </aside>

        <section className="studio-stage" aria-label={t('studio.tabs.preview')}>
          <div className="studio-monitor">
            <StudioPhonePreview
              videoId={videoId}
              videoUrl={videoUrl}
              playableVideoUrl={playbackUrl}
              selectedClip={selectedClip}
              previewStart={trim.preview.start}
              previewEnd={trim.preview.end}
              selectedTemplate={style.template}
              selectedFilter={style.filter}
              selectedFont={style.font}
              selectedAnimation={style.animation}
              captionAnimation={extras.captionAnimation}
              ctaEnabled={extras.ctaEnabled}
              ctaText={extras.ctaText}
              ctaType={extras.ctaType}
              caption={caption}
              selectedPlatform={platformId}
              isPlaying={isPlaying}
              isMuted={isMuted}
              isMobile={isMobile}
              onPlayingChange={setIsPlaying}
              onMutedChange={setIsMuted}
              onRefreshSrc={refresh}
            />
          </div>
          <StudioTrimBar
            start={trim.trim.start}
            end={trim.trim.end}
            window={trim.window}
            duration={trim.duration}
            isOriginal={trim.isOriginal}
            onStart={trim.setStart}
            onEnd={trim.setEnd}
            onReset={trim.reset}
          />
        </section>

        <aside className="studio-side" aria-label={t('studio.tabs.share')}>
          <StudioSharePanel
            renderState={renderState}
            renderProgress={renderProgress[clipIndex] ?? 0}
            isYouTubeSource={isYouTubeSource}
            clipTitle={clipTitle}
            clipId={clipId}
            caption={caption}
            platformId={platformId}
            onPlatform={setPlatformId}
            topQuote={quotableMoments[0]?.text}
            hook={selectedClip.engagement_hook?.trim() || undefined}
            youtubeConnected={Boolean(userStatus?.youtubeConnected)}
            isPublishing={youtube.isPublishing}
            onExport={handleExport}
            onDownload={handleDownload}
            onPublishYouTube={youtube.publish}
          />
        </aside>
      </div>

      <nav className="studio-mobile-nav" aria-label="Studio views">
        {MOBILE_VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={mobileView === v.id}
            className={mobileView === v.id ? 'is-active' : ''}
            onClick={() => setMobileView(v.id)}
          >
            {t(v.labelKey)}
          </button>
        ))}
      </nav>

      {upgradePrompt && (
        <UpgradePromptModal
          open
          feature={UPGRADE_COPY[upgradePrompt].feature}
          planName={UPGRADE_COPY[upgradePrompt].plan}
          price={UPGRADE_COPY[upgradePrompt].price}
          onClose={() => setUpgradePrompt(null)}
        />
      )}
    </div>
  );
}
