'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { STUDIO_FILTERS, STUDIO_FONTS, STUDIO_TEMPLATES } from '@/lib/studio/constants';
import { CAPTION_ANIMATIONS, resolveCtaText, type CaptionAnimationId, type CtaTypeId } from '@/lib/studio/exportOptions';
import type { SermonClip } from '@/lib/studio/types';

type MediaState = 'idle' | 'loading' | 'ready' | 'error';

interface StudioPhonePreviewProps {
  videoId: string | null;
  videoUrl: string | null;
  playableVideoUrl: string | null;
  selectedClip: SermonClip & { index: number };
  previewStart: number;
  previewEnd: number;
  selectedTemplate: string;
  selectedFilter: string;
  selectedFont: string;
  selectedAnimation: string;
  captionAnimation?: CaptionAnimationId;
  ctaEnabled?: boolean;
  ctaType?: CtaTypeId;
  ctaText?: string;
  caption: string;
  selectedPlatform: string;
  isPlaying: boolean;
  isMuted: boolean;
  isMobile: boolean;
  onPlayingChange: (playing: boolean) => void;
  onMutedChange: (muted: boolean) => void;
}

export default function StudioPhonePreview({
  videoId,
  videoUrl,
  playableVideoUrl,
  selectedClip,
  previewStart,
  previewEnd,
  selectedTemplate,
  selectedFilter,
  selectedFont,
  selectedAnimation,
  captionAnimation = 'slideUp',
  ctaEnabled = false,
  ctaType = 'subscribe',
  ctaText = '',
  caption,
  selectedPlatform,
  isPlaying,
  isMuted,
  isMobile,
  onPlayingChange,
  onMutedChange,
}: StudioPhonePreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaState, setMediaState] = useState<MediaState>('idle');

  const filterCss = STUDIO_FILTERS.find((f) => f.id === selectedFilter)?.css || 'none';
  const template = STUDIO_TEMPLATES.find((t) => t.id === selectedTemplate);
  const font = STUDIO_FONTS.find((f) => f.id === selectedFont);
  const captionAnimClass =
    CAPTION_ANIMATIONS.find((a) => a.id === captionAnimation)?.previewClass || 'animate-caption-slide-up';
  const endCardText = ctaEnabled ? resolveCtaText(ctaType, ctaText) : '';

  const src = playableVideoUrl || videoUrl || '';
  const isAudio =
    src.match(/\.(mp3|m4a|wav|aac|ogg|flac|wma|mp4a|m4b)($|\?)/i) || src.toLowerCase().includes('audio');
  const hasSource = Boolean(videoId || src);
  const showPlayOverlay = !isPlaying && hasSource && mediaState !== 'error';

  useEffect(() => {
    if (videoId) {
      setMediaState('ready');
      return;
    }
    if (!src) {
      setMediaState('idle');
      return;
    }
    setMediaState('loading');
  }, [src, videoId]);

  const playPreview = useCallback(async () => {
    const video = videoRef.current;
    if (videoId) {
      onPlayingChange(true);
      return;
    }
    if (!video || !src) return;

    const seekToStart = () => {
      if (previewEnd > previewStart && Number.isFinite(previewStart)) {
        video.currentTime = previewStart;
      }
    };

    try {
      if (video.readyState < 1) {
        await new Promise<void>((resolve, reject) => {
          const onReady = () => {
            cleanup();
            resolve();
          };
          const onFail = () => {
            cleanup();
            reject(new Error('Video failed to load'));
          };
          const cleanup = () => {
            video.removeEventListener('loadedmetadata', onReady);
            video.removeEventListener('error', onFail);
          };
          video.addEventListener('loadedmetadata', onReady);
          video.addEventListener('error', onFail);
          video.load();
        });
      }

      seekToStart();
      video.muted = isMuted;
      await video.play();
      onPlayingChange(true);
    } catch {
      try {
        video.muted = true;
        onMutedChange(true);
        await video.play();
        onPlayingChange(true);
      } catch {
        onPlayingChange(false);
        if (video.readyState >= 2) {
          setMediaState('ready');
        } else {
          setMediaState('error');
        }
      }
    }
  }, [videoId, src, previewEnd, previewStart, isMuted, onPlayingChange, onMutedChange]);

  const pausePreview = useCallback(() => {
    videoRef.current?.pause();
    onPlayingChange(false);
  }, [onPlayingChange]);

  const togglePreview = useCallback(() => {
    if (isPlaying) pausePreview();
    else void playPreview();
  }, [isPlaying, pausePreview, playPreview]);

  useEffect(() => {
    if (!isPlaying) videoRef.current?.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  // Loop clip segment via currentTime — #t= fragments break many signed CDN URLs.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src || videoId) return;

    const seekToStart = () => {
      if (Number.isFinite(previewStart)) {
        video.currentTime = previewStart;
      }
    };

    const onTimeUpdate = () => {
      if (previewEnd > previewStart && video.currentTime >= previewEnd) {
        video.currentTime = previewStart;
      }
    };

    video.addEventListener('loadedmetadata', seekToStart);
    video.addEventListener('timeupdate', onTimeUpdate);
    if (video.readyState >= 1) seekToStart();

    return () => {
      video.removeEventListener('loadedmetadata', seekToStart);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [src, previewStart, previewEnd, videoId]);

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          left: '-14px',
          top: '100px',
          width: '3px',
          height: '24px',
          background: '#27272A',
          borderRadius: '2px 0 0 2px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '-14px',
          top: '140px',
          width: '3px',
          height: '48px',
          background: '#27272A',
          borderRadius: '2px 0 0 2px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '-14px',
          top: '196px',
          width: '3px',
          height: '48px',
          background: '#27272A',
          borderRadius: '2px 0 0 2px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '-14px',
          top: '160px',
          width: '3px',
          height: '80px',
          background: '#27272A',
          borderRadius: '0 2px 2px 0',
        }}
      />

      <div
        className="premium-border"
        style={{
          height: 'min(640px, 60vh)',
          width: 'auto',
          aspectRatio: '9/19.5',
          background: '#000',
          borderRadius: '48px',
          border: '8px solid #18181B',
          boxShadow:
            '0 30px 60px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05), inset 0 0 15px rgba(255,255,255,0.05)',
          position: 'relative',
          overflow: 'hidden',
          maxHeight: 'calc(100vh - 240px)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '4px',
            borderRadius: '48px',
            border: '1px solid rgba(255,255,255,0.08)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100px',
            height: '30px',
            background: '#000',
            borderRadius: '20px',
            zIndex: 100,
          }}
        />

        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
          {videoId ? (
            <iframe
              key={`${videoId}-${isPlaying}-${isMuted}`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                transform: 'scale(1.05)',
                filter: filterCss,
              }}
              src={`https://www.youtube.com/embed/${videoId}?start=${previewStart}&end=${previewEnd}&autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0`}
              allow="autoplay; encrypted-media"
              title="Clip preview"
            />
          ) : src ? (
            <div style={{ width: '100%', height: '100%', position: 'relative', background: '#050508' }}>
              {isAudio && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                      'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&q=80")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                  }}
                >
                  <div
                    className="glass-card premium-border"
                    style={{
                      padding: '24px 16px',
                      borderRadius: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '16px',
                      background: 'rgba(5, 5, 8, 0.75)',
                      backdropFilter: 'blur(16px)',
                      width: '100%',
                      maxWidth: '240px',
                    }}
                  >
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: isPlaying ? 'spinGlow 8s linear infinite' : 'none',
                      }}
                    >
                      <span style={{ fontSize: '28px' }}>🎙️</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', textAlign: 'center' }}>
                      {selectedClip.hook_title || 'Sermon Harvest'}
                    </div>
                  </div>
                </div>
              )}
              <video
                ref={videoRef}
                key={src}
                src={src}
                loop
                playsInline
                muted={isMuted}
                preload="auto"
                onLoadedData={() => setMediaState('ready')}
                onPlay={() => onPlayingChange(true)}
                onPause={() => onPlayingChange(false)}
                onError={() => {
                  onPlayingChange(false);
                  setMediaState('error');
                }}
                onCanPlay={() => setMediaState('ready')}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: isAudio ? 0 : mediaState === 'ready' || isPlaying ? 1 : 0.35,
                  filter: filterCss,
                  transition: 'opacity 0.25s ease',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '32px',
                textAlign: 'center',
                background: 'radial-gradient(circle at 50% 30%, rgba(139,92,246,0.12), transparent 60%)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'rgba(139,92,246,0.15)',
                  border: '1px solid rgba(139,92,246,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                }}
              >
                🎬
              </div>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>Preview loading</p>
              <p style={{ fontSize: '12px', color: '#71717A', lineHeight: 1.5, maxWidth: '220px' }}>
                Resolving your sermon video. If this persists, refresh or re-open Studio from the clip card.
              </p>
            </div>
          )}

          {mediaState === 'loading' && src && !videoId && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(5,5,8,0.55)',
                zIndex: 70,
              }}
            >
              <div
                className="studio-preview-spinner"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '3px solid rgba(139,92,246,0.25)',
                  borderTopColor: '#8B5CF6',
                }}
              />
            </div>
          )}

          {mediaState === 'error' && !videoId && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '24px',
                background: 'rgba(5,5,8,0.85)',
                zIndex: 75,
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>Couldn&apos;t load preview</p>
              <p style={{ fontSize: '12px', color: '#71717A', lineHeight: 1.5 }}>
                The video URL may have expired. Try playing again or close and reopen Studio.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMediaState('loading');
                  void playPreview();
                }}
                className="vesper-btn vesper-btn-outline shimmer-effect"
                style={{ padding: '10px 18px', fontSize: '12px' }}
              >
                Retry preview
              </button>
            </div>
          )}

          {showPlayOverlay && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 80,
              }}
            >
              <button
                type="button"
                onClick={() => void playPreview()}
                aria-label="Play preview"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.95), rgba(109,40,217,0.95))',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  boxShadow: '0 8px 32px rgba(139,92,246,0.45)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.06)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(139,92,246,0.55)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(139,92,246,0.45)';
                }}
              >
                ▶
              </button>
            </div>
          )}

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '100px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              zIndex: 60,
              display: 'flex',
              alignItems: 'flex-end',
              padding: '0 24px 24px',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => void togglePreview()}
                disabled={!hasSource || mediaState === 'error'}
                aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  cursor: hasSource && mediaState !== 'error' ? 'pointer' : 'not-allowed',
                  opacity: hasSource && mediaState !== 'error' ? 1 : 0.45,
                }}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button
                type="button"
                onClick={() => onMutedChange(!isMuted)}
                disabled={!hasSource}
                aria-label={isMuted ? 'Unmute preview' : 'Mute preview'}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  cursor: hasSource ? 'pointer' : 'not-allowed',
                  opacity: hasSource ? 1 : 0.45,
                }}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 900,
                color: '#fff',
                opacity: 0.75,
                letterSpacing: '0.12em',
              }}
            >
              PREVIEW ONLY
            </span>
          </div>

          <div style={{ position: 'absolute', bottom: '22%', left: '8%', right: '8%', zIndex: 20 }}>
            <div
              key={`${captionAnimation}-${selectedClip.index}`}
              className={captionAnimClass}
              style={{
                textAlign: 'center',
                color: template?.color || '#fff',
                fontFamily: font?.family || 'inherit',
                fontWeight: font?.weight || 900,
                fontSize: isMobile ? '22px' : '20px',
                textShadow: template?.textShadow || 'none',
                fontStyle: template?.fontStyle || 'normal',
                textTransform: 'uppercase',
                lineHeight: 1.1,
              }}
            >
              {caption}
            </div>
          </div>

          {endCardText ? (
            <div
              className="animate-caption-scale-pulse"
              style={{
                position: 'absolute',
                bottom: '38%',
                left: '10%',
                right: '10%',
                zIndex: 25,
                textAlign: 'center',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.55)',
                border: `2px solid ${template?.color || '#fff'}`,
                color: template?.color || '#fff',
                fontFamily: font?.family || 'inherit',
                fontWeight: 900,
                fontSize: isMobile ? '14px' : '13px',
                letterSpacing: '0.04em',
              }}
            >
              {endCardText}
            </div>
          ) : null}

          <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none', opacity: 0.8 }}>
            {selectedPlatform === 'tiktok' && (
              <div
                style={{
                  position: 'absolute',
                  right: '12px',
                  bottom: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '24px' }}>❤️</span>
                <span style={{ fontSize: '24px' }}>💬</span>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '80px' }}>
              <div style={{ fontSize: '14px', fontWeight: 900, marginBottom: '4px' }}>@yourministry</div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#fff',
                  opacity: 0.9,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {caption}
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.4) 100%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}
