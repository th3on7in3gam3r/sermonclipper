'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import StudioPhonePreview from './StudioPhonePreview';
import CaptionEditor from './CaptionEditor';
import StudioExportPanel from './StudioExportPanel';
import UpgradePromptModal from '@/components/shared/UpgradePromptModal';
import EmptyState from '@/components/shared/EmptyState';
import { parseTime, formatTime } from '@/lib/parseTime';
import { loadBrandKit, migrateStoredBrandKit, saveBrandKit } from '@/lib/studio/brandKit';
import { planAllowsTemplate, planAllowsExport, UPGRADE_COPY, type UpgradeFeature } from '@/lib/plans';
import {
  STUDIO_TEMPLATES,
  STUDIO_FILTERS,
  STUDIO_FONTS,
  STUDIO_ANIMATIONS,
  STUDIO_PLATFORMS,
  STUDIO_TABS,
  MOBILE_TABS,
} from '@/lib/studio/constants';
import type { ExportSettings, RenderState, SermonClip, UserStatus } from '@/lib/studio/types';

interface VesperStudioProps {
  selectedClip: SermonClip & { index: number };
  onClose: () => void;
  jobId?: string | null;
  videoId: string | null;
  videoUrl: string | null;
  playableVideoUrl: string | null;
  rendering: Record<number, RenderState>;
  renderProgress: Record<number, number>;
  startExport: (clip: SermonClip & { index: number }, settings: ExportSettings) => void;
  isMobile: boolean;
  userStatus: UserStatus | null;
  isYouTubeSource: boolean;
}

function getDefaultCaption(clip: SermonClip, overrides: Record<number, string>): string {
  return overrides[clip.index] ?? clip.suggested_captions?.[0] ?? clip.main_quote ?? '';
}

function getInitialStyleState() {
  const kit = loadBrandKit();
  return {
    template: kit?.template ?? 'minimal',
    filter: kit?.filter ?? 'none',
    font: kit?.font ?? 'outfit',
    animation: kit?.animation ?? 'fade',
  };
}

export default function VesperStudio({
  selectedClip,
  onClose,
  jobId,
  videoId,
  videoUrl,
  playableVideoUrl,
  rendering,
  renderProgress,
  startExport,
  isMobile,
  userStatus,
  isYouTubeSource,
}: VesperStudioProps) {
  const clipStart = parseTime(selectedClip.start);
  const clipEnd = parseTime(selectedClip.end);
  const initialStyle = getInitialStyleState();

  const [activeTab, setActiveTab] = useState<string>('templates');
  const [mobileTab, setMobileTab] = useState('style');

  const [selectedTemplate, setSelectedTemplate] = useState(initialStyle.template);
  const [selectedFilter, setSelectedFilter] = useState(initialStyle.filter);
  const [selectedFont, setSelectedFont] = useState(initialStyle.font);
  const [selectedAnimation, setSelectedAnimation] = useState(initialStyle.animation);

  const [trimStart, setTrimStart] = useState(clipStart);
  const [trimEnd, setTrimEnd] = useState(clipEnd);
  const [previewStart, setPreviewStart] = useState(clipStart);
  const [previewEnd, setPreviewEnd] = useState(clipEnd);

  const [captionOverrides, setCaptionOverrides] = useState<Record<number, string>>({});
  const [captionFontSize, setCaptionFontSize] = useState(20);
  const [captionColor, setCaptionColor] = useState('#FFFFFF');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('tiktok');
  const [isUploadingYT, setIsUploadingYT] = useState(false);
  const [upgradePrompt, setUpgradePrompt] = useState<UpgradeFeature | null>(null);

  const clipIndex = selectedClip.index;
  const renderState = rendering[clipIndex];
  const caption = useMemo(
    () => getDefaultCaption(selectedClip, captionOverrides),
    [selectedClip, captionOverrides]
  );

  useEffect(() => {
    migrateStoredBrandKit();
  }, []);

  const applyTrimPreview = useCallback(() => {
    setPreviewStart(trimStart);
    setPreviewEnd(trimEnd);
  }, [trimStart, trimEnd]);

  const handleCaptionChange = (text: string) => {
    setCaptionOverrides((prev) => ({ ...prev, [clipIndex]: text }));
  };

  const handleSaveProfile = () => {
    if (userStatus?.plan === 'free' || userStatus?.plan === null || userStatus?.plan === undefined) {
      setUpgradePrompt('custom_branding');
      return;
    }
    saveBrandKit({
      template: selectedTemplate,
      filter: selectedFilter,
      font: selectedFont,
      animation: selectedAnimation,
    });
    toast.success('Profile saved — your defaults are kept for next session');
  };

  const handleSelectTemplate = (templateId: string) => {
    if (!planAllowsTemplate(userStatus?.plan, templateId)) {
      setUpgradePrompt('caption_templates');
      return;
    }
    setSelectedTemplate(templateId);
  };

  const handleRestyle = () => {
    setActiveTab('templates');
    const idx = STUDIO_TEMPLATES.findIndex((t) => t.id === selectedTemplate);
    const next = STUDIO_TEMPLATES[(idx + 1) % STUDIO_TEMPLATES.length];
    handleSelectTemplate(next.id);
    toast.success(`Caption template: ${next.name} — preview updates instantly`);
  };

  const handleStartExport = () => {
    if (isYouTubeSource) {
      toast.error('Export requires a direct MP4 upload. YouTube links can be previewed only.');
      return;
    }

    const canExport =
      planAllowsExport(userStatus?.plan) || userStatus?.isAdmin === true;

    if (!canExport) {
      setUpgradePrompt('export');
      toast.error('Export requires the Creator plan ($19/mo). Upgrade to generate reels.', {
        duration: 5000,
      });
      return;
    }

    const settings: ExportSettings = {
      template: selectedTemplate,
      filter: selectedFilter,
      font: selectedFont,
      animation: selectedAnimation,
      trimStart,
      trimEnd,
      caption,
    };
    startExport(selectedClip, settings);
  };

  const handleYouTubeSync = async () => {
    if (!renderState?.url) return toast.error('Render the reel first');
    if (isYouTubeSource) return toast.error('YouTube source clips cannot be exported from Vesper');

    setIsUploadingYT(true);
    const toastId = toast.loading('Syncing with YouTube...');

    try {
      if (!userStatus?.youtubeConnected) {
        const authRes = await fetch('/api/youtube/auth');
        const authData = await authRes.json();
        if (authData.url) {
          window.location.href = authData.url;
          return;
        }
      }

      const res = await fetch('/api/youtube/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: renderState.url,
          title: selectedClip.hook_title || 'Sermon Clip',
          description: caption,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      toast.success('Published to YouTube Shorts', { id: toastId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error(message, { id: toastId });
    } finally {
      setIsUploadingYT(false);
    }
  };

  const selectedPlatformConfig = STUDIO_PLATFORMS.find((p) => p.id === selectedPlatform);
  const platformCaption = `${selectedPlatformConfig?.prefix ?? ''}${caption}`;
  const charCount = platformCaption.length;
  const overLimit = selectedPlatformConfig?.limit ? charCount > selectedPlatformConfig.limit : false;
  const trimDuration = trimEnd - trimStart;
  const hasSocialCaption = Boolean(
    selectedClip.suggested_captions?.some((c) => c?.trim()) ||
      captionOverrides[clipIndex]?.trim()
  );
  const hasExport = renderState?.status === 'complete' && renderState?.url;

  return (
    <div
      className="vesper-mesh-bg-container"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: '#050508',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="vesper-mesh-bg" />

      <header
        className="glass-card"
        style={{
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          borderRadius: 0,
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/vesper-logo-icon.png" alt="Vesper Studio logo" style={{ height: '32px', width: 'auto' }} />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '0.15em', color: '#fff' }}>
              <span style={{ color: '#8B5CF6' }}>VES</span>PER{' '}
              <span style={{ opacity: 0.5, fontWeight: 300, fontSize: '16px' }}>STUDIO</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700 }}>
              NEURAL EDITING SUITE
            </div>
          </div>
          {isYouTubeSource && !isMobile && (
            <div className="vesper-badge badge-gold" style={{ marginLeft: '16px', fontSize: '11px' }}>
              PREVIEW ONLY
            </div>
          )}
        </div>
        <button type="button" onClick={onClose} className="vesper-btn-outline shimmer-effect" style={{ padding: '10px 20px' }}>
          ✕ CLOSE
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>
        {/* Left: style tools */}
        <aside
          className="studio-panel"
          style={{
            width: isMobile ? '100%' : '340px',
            display: isMobile ? (mobileTab === 'style' ? 'flex' : 'none') : 'flex',
            flexDirection: 'column',
            borderRadius: 0,
            borderTop: 'none',
            borderBottom: 'none',
            borderLeft: 'none',
            background: 'rgba(10, 10, 15, 0.4)',
          }}
        >
          <nav style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {STUDIO_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? 'studio-tab-active' : ''}
                style={{
                  position: 'relative',
                  padding: '16px 4px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-dim)',
                }}
              >
                <span style={{ fontSize: '20px' }}>{tab.icon}</span>
                <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.08em' }}>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeTab === 'templates' &&
              STUDIO_TEMPLATES.map((t) => (
                <OptionCard
                  key={t.id}
                  selected={selectedTemplate === t.id}
                  onSelect={() => handleSelectTemplate(t.id)}
                  title={t.name}
                  desc={t.desc}
                  swatch={t.color}
                  locked={!planAllowsTemplate(userStatus?.plan, t.id)}
                />
              ))}

            {activeTab === 'filters' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {STUDIO_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFilter(f.id)}
                    className="glass-card"
                    style={{
                      padding: 0,
                      borderRadius: '16px',
                      cursor: 'pointer',
                      borderColor: selectedFilter === f.id ? 'var(--primary)' : 'var(--card-border)',
                      overflow: 'hidden',
                    }}
                  >
                    <div className={f.preview} style={{ height: '64px' }} />
                    <div style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 800 }}>{f.name}</div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'fonts' &&
              STUDIO_FONTS.map((f) => (
                <OptionCard
                  key={f.id}
                  selected={selectedFont === f.id}
                  onSelect={() => setSelectedFont(f.id)}
                  title={f.name}
                  desc={f.desc}
                  fontFamily={f.family}
                />
              ))}

            {activeTab === 'motion' &&
              STUDIO_ANIMATIONS.map((a) => (
                <OptionCard
                  key={a.id}
                  selected={selectedAnimation === a.id}
                  onSelect={() => setSelectedAnimation(a.id)}
                  title={a.name}
                  desc={a.desc}
                />
              ))}

            {activeTab === 'trim' && (
              <div style={{ padding: '20px', background: 'rgba(139,92,246,0.04)', borderRadius: '20px', border: '1px solid rgba(139,92,246,0.15)' }}>
                <label style={{ display: 'block', marginBottom: '20px' }}>
                  <span style={{ fontSize: '13px', color: '#71717A', fontWeight: 800 }}>START</span>
                  <span style={{ float: 'right', fontFamily: 'monospace', fontWeight: 900 }}>{formatTime(trimStart)}</span>
                  <input
                    type="range"
                    min={Math.max(0, parseTime(selectedClip.start) - 60)}
                    max={trimEnd - 1}
                    value={trimStart}
                    onChange={(e) => setTrimStart(Number(e.target.value))}
                    onMouseUp={applyTrimPreview}
                    onTouchEnd={applyTrimPreview}
                    style={{ width: '100%', accentColor: '#8B5CF6', marginTop: '8px' }}
                  />
                </label>
                <label style={{ display: 'block', marginBottom: '20px' }}>
                  <span style={{ fontSize: '13px', color: '#71717A', fontWeight: 800 }}>END</span>
                  <span style={{ float: 'right', fontFamily: 'monospace', fontWeight: 900 }}>{formatTime(trimEnd)}</span>
                  <input
                    type="range"
                    min={trimStart + 1}
                    max={parseTime(selectedClip.end) + 60}
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(Number(e.target.value))}
                    onMouseUp={applyTrimPreview}
                    onTouchEnd={applyTrimPreview}
                    style={{ width: '100%', accentColor: '#8B5CF6', marginTop: '8px' }}
                  />
                </label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 900 }}>{trimDuration}s</span>
                  <span style={{ color: trimDuration > 60 ? '#EF4444' : '#10B981', fontSize: '12px', fontWeight: 900 }}>
                    {trimDuration > 60 ? 'OVER 60s LIMIT' : 'READY'}
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'publish' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {!hasExport ? (
                  <EmptyState
                    compact
                    icon="📥"
                    headline="No exports yet"
                    subtext="Customize your reel and hit Generate Reel to render a downloadable 9:16 MP4."
                    ctaLabel="Generate Reel"
                    onCtaClick={handleStartExport}
                  />
                ) : (
                  <>
                    <PublishCard
                      title="YouTube Shorts"
                      icon="▶️"
                      desc="Publish rendered reel to your connected channel."
                      actionLabel={userStatus?.youtubeConnected ? 'PUBLISH SHORT' : 'CONNECT CHANNEL'}
                      disabled={renderState?.status !== 'complete' || isUploadingYT}
                      onAction={handleYouTubeSync}
                    />
                    <PublishCard
                      title="Download MP4"
                      icon="📥"
                      desc="Save the rendered file for TikTok or Instagram."
                      actionLabel="DOWNLOAD"
                      disabled={renderState?.status !== 'complete'}
                      onAction={() => renderState?.url && window.open(renderState.url)}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)' }}>
            <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <strong style={{ color: '#fff' }}>{STUDIO_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}</strong>
              {' · '}
              {STUDIO_FILTERS.find((f) => f.id === selectedFilter)?.name}
              {' · '}
              {STUDIO_FONTS.find((f) => f.id === selectedFont)?.name}
            </div>
            <StudioExportPanel
              renderState={renderState}
              renderProgress={renderProgress[clipIndex] ?? 0}
              isYouTubeSource={isYouTubeSource}
              clipTitle={selectedClip.hook_title || selectedClip.main_quote || 'Sermon clip'}
              onGenerate={handleStartExport}
              onSaveProfile={handleSaveProfile}
            />
          </div>
        </aside>

        {/* Center: caption editor + timeline */}
        <section
          style={{
            flex: 1,
            display: isMobile ? (mobileTab === 'preview' ? 'flex' : 'none') : 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: isMobile ? '20px 16px' : '40px',
            overflow: 'auto',
          }}
        >
          <CaptionEditor
            caption={captionOverrides[clipIndex] ?? caption}
            clipStart={previewStart}
            clipEnd={previewEnd}
            jobId={jobId || undefined}
            clipIndex={clipIndex}
            onCaptionChange={handleCaptionChange}
            onRestyle={handleRestyle}
            captionFontSize={captionFontSize}
            captionColor={captionColor}
            onFontSizeChange={setCaptionFontSize}
            onColorChange={setCaptionColor}
          />
        </section>

        {/* Right: live phone preview + social kit */}
        <aside
          className="studio-panel"
          style={{
            width: isMobile ? '100%' : '380px',
            display: isMobile ? (mobileTab === 'social' || mobileTab === 'export' ? 'flex' : 'none') : 'flex',
            flexDirection: 'column',
            borderRadius: 0,
            borderTop: 'none',
            borderBottom: 'none',
            borderRight: 'none',
            background: 'rgba(10, 10, 15, 0.4)',
          }}
        >
          <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <StudioPhonePreview
              videoId={videoId}
              videoUrl={videoUrl}
              playableVideoUrl={playableVideoUrl}
              selectedClip={selectedClip}
              previewStart={previewStart}
              previewEnd={previewEnd}
              selectedTemplate={selectedTemplate}
              selectedFilter={selectedFilter}
              selectedFont={selectedFont}
              selectedAnimation={selectedAnimation}
              caption={captionOverrides[clipIndex] ?? caption}
              captionFontSize={captionFontSize}
              captionColor={captionColor}
              selectedPlatform={selectedPlatform}
              isPlaying={isPlaying}
              isMuted={isMuted}
              isMobile={isMobile}
              onPlayingChange={setIsPlaying}
              onMutedChange={setIsMuted}
            />
          </div>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="vesper-badge badge-green" style={{ marginBottom: '8px' }}>MEDIA KIT</div>
            <h3 style={{ fontSize: '18px', fontWeight: 900 }}>Social Distribution</h3>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {STUDIO_PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlatform(p.id)}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: '12px',
                    border: `1px solid ${selectedPlatform === p.id ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                    background: selectedPlatform === p.id ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                  }}
                >
                  {p.icon}
                </button>
              ))}
            </div>

            {!hasSocialCaption ? (
              <EmptyState
                compact
                icon="💬"
                headline="No Social Kit captions yet"
                subtext="Captions are generated during AI analysis. Edit the live caption below or re-run analysis on a new sermon."
                ctaLabel="Edit caption"
                onCtaClick={() => setMobileTab('preview')}
              />
            ) : selectedPlatformConfig ? (
              <div className="glass-card" style={{ padding: '20px', borderColor: 'var(--primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '24px' }}>{selectedPlatformConfig.icon}</span>
                  <span style={{ fontWeight: 900 }}>{selectedPlatformConfig.label}</span>
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#E4E4E7', marginBottom: '12px' }}>{platformCaption}</p>
                <p style={{ fontSize: '11px', color: overLimit ? '#EF4444' : '#52525B', marginBottom: '16px', fontWeight: 800 }}>
                  {charCount}
                  {selectedPlatformConfig.limit ? ` / ${selectedPlatformConfig.limit}` : ''} chars
                  {overLimit ? ' — over limit' : ''}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(platformCaption);
                    toast.success(`${selectedPlatformConfig.label} caption copied`);
                  }}
                  className="vesper-btn vesper-btn-outline shimmer-effect"
                  style={{ width: '100%', marginBottom: '12px' }}
                >
                  COPY CAPTION
                </button>
                {selectedPlatform === 'youtube' && (
                  <button
                    type="button"
                    onClick={handleYouTubeSync}
                    disabled={isUploadingYT || renderState?.status !== 'complete'}
                    className="vesper-btn vesper-btn-primary shimmer-effect"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(90deg, #FF0000, #CC0000)',
                      opacity: isUploadingYT || renderState?.status !== 'complete' ? 0.6 : 1,
                    }}
                  >
                    {isUploadingYT ? 'PUBLISHING…' : 'PUBLISH YT SHORT'}
                  </button>
                )}
              </div>
            ) : null}

            <div className="glass-card" style={{ padding: '20px', marginTop: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--primary)', marginBottom: '8px' }}>NEURAL HOOK</div>
              <p style={{ fontSize: '16px', color: '#fff', lineHeight: 1.5, fontWeight: 700 }}>
                &ldquo;{selectedClip.engagement_hook || 'High-impact theological insight.'}&rdquo;
              </p>
            </div>
          </div>

          {isMobile && mobileTab === 'export' && (
            <div style={{ padding: '24px' }}>
              <StudioExportPanel
                renderState={renderState}
                renderProgress={renderProgress[clipIndex] ?? 0}
                isYouTubeSource={isYouTubeSource}
                clipTitle={selectedClip.hook_title || selectedClip.main_quote || 'Sermon clip'}
                onGenerate={handleStartExport}
                showSaveSlot={false}
              />
            </div>
          )}
        </aside>
      </div>

      {isMobile && (
        <nav
          className="glass-card"
          style={{
            height: '84px',
            borderRadius: '24px 24px 0 0',
            display: 'flex',
            borderBottom: 'none',
            paddingBottom: '12px',
          }}
        >
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: mobileTab === tab.id ? 'var(--primary)' : 'var(--text-dim)',
              }}
            >
              <span style={{ fontSize: '24px' }}>{tab.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: 900 }}>{tab.label}</span>
            </button>
          ))}
        </nav>
      )}

      <UpgradePromptModal
        open={upgradePrompt !== null}
        feature={upgradePrompt ? UPGRADE_COPY[upgradePrompt].feature : ''}
        planName={upgradePrompt ? UPGRADE_COPY[upgradePrompt].plan : ''}
        price={upgradePrompt ? UPGRADE_COPY[upgradePrompt].price : ''}
        onClose={() => setUpgradePrompt(null)}
      />
    </div>
  );
}

function OptionCard({
  selected,
  onSelect,
  title,
  desc,
  swatch,
  fontFamily,
  locked,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  desc: string;
  swatch?: string;
  fontFamily?: string;
  locked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="glass-card"
      style={{
        padding: '16px',
        borderRadius: '16px',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        background: selected ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)',
        borderColor: selected ? 'var(--primary)' : 'var(--card-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      {swatch && (
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            flexShrink: 0,
            background: `linear-gradient(135deg, ${swatch}22, ${swatch}66)`,
            border: `1px solid ${swatch}44`,
          }}
        />
      )}
      <div>
        <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', fontFamily }}>{title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{desc}</div>
        {locked && (
          <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 900, color: '#FBBF24', letterSpacing: '0.08em' }}>
            PRO
          </span>
        )}
      </div>
    </button>
  );
}

function PublishCard({
  title,
  icon,
  desc,
  actionLabel,
  disabled,
  onAction,
}: {
  title: string;
  icon: string;
  desc: string;
  actionLabel: string;
  disabled?: boolean;
  onAction: () => void;
}) {
  return (
    <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
      <div style={{ fontSize: '44px', marginBottom: '12px' }}>{icon}</div>
      <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '8px' }}>{title}</h3>
      <p style={{ fontSize: '14px', color: '#71717A', marginBottom: '20px', lineHeight: 1.5 }}>{desc}</p>
      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className="vesper-btn vesper-btn-primary shimmer-effect"
        style={{ width: '100%', opacity: disabled ? 0.5 : 1 }}
      >
        {actionLabel}
      </button>
    </div>
  );
}
