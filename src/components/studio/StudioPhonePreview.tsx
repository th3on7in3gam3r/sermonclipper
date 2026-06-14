'use client';

import React, { useEffect, useRef } from 'react';
import { STUDIO_ANIMATIONS, STUDIO_FILTERS, STUDIO_FONTS, STUDIO_TEMPLATES } from '@/lib/studio/constants';
import type { SermonClip } from '@/lib/studio/types';

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
  caption,
  selectedPlatform,
  isPlaying,
  isMuted,
  isMobile,
  onPlayingChange,
  onMutedChange,
}: StudioPhonePreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const filterCss = STUDIO_FILTERS.find((f) => f.id === selectedFilter)?.css || 'none';
  const template = STUDIO_TEMPLATES.find((t) => t.id === selectedTemplate);
  const font = STUDIO_FONTS.find((f) => f.id === selectedFont);
  const animationClass =
    STUDIO_ANIMATIONS.find((a) => a.id === selectedAnimation)?.class || 'animate-studio-fade';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.play().catch(() => onPlayingChange(false));
    } else {
      video.pause();
    }
  }, [isPlaying, onPlayingChange]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  const src = playableVideoUrl || videoUrl || '';
  const isAudio =
    src.match(/\.(mp3|m4a|wav|aac|ogg|flac|wma|mp4a|m4b)($|\?)/i) || src.toLowerCase().includes('audio');

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
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                transform: 'scale(1.05)',
                filter: filterCss,
              }}
              src={`https://www.youtube.com/embed/${videoId}?start=${previewStart}&end=${previewEnd}&autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0`}
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
                autoPlay
                muted={isMuted}
                preload="auto"
                onPlay={() => onPlayingChange(true)}
                onPause={() => onPlayingChange(false)}
                onError={() => onPlayingChange(false)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: isAudio ? 0 : 1,
                  filter: filterCss,
                }}
              />
            </div>
          ) : null}

          {!isPlaying && !videoId && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 50,
              }}
            >
              <button
                type="button"
                onClick={() => onPlayingChange(true)}
                style={{
                  background: 'rgba(139,92,246,0.8)',
                  border: 'none',
                  color: '#fff',
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  cursor: 'pointer',
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
                onClick={() => onPlayingChange(!isPlaying)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                }}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button
                type="button"
                onClick={() => onMutedChange(!isMuted)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                }}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 900, color: '#fff', opacity: 0.8 }}>PREVIEW</span>
          </div>

          <div style={{ position: 'absolute', bottom: '22%', left: '8%', right: '8%', zIndex: 20 }}>
            <div
              key={`${selectedAnimation}-${selectedClip.index}`}
              className={animationClass}
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
