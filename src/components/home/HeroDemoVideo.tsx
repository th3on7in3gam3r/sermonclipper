'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { HeroDemoPanel } from '@/lib/heroDemoConfig';

interface HeroDemoVideoProps {
  panel: HeroDemoPanel;
  className?: string;
  controlClassName?: string;
  ariaLabel: string;
}

type DemoPayload = {
  url: string;
  fallbackUrl: string;
  clipStart: number;
  clipEnd: number | null;
};

export default function HeroDemoVideo({ panel, className, controlClassName, ariaLabel }: HeroDemoVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [demo, setDemo] = useState<DemoPayload | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/demo-video?panel=${panel}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const url = data.url || data.fallbackUrl;
        if (!url) {
          setLoadError(true);
          return;
        }
        setDemo({
          url,
          fallbackUrl: data.fallbackUrl || url,
          clipStart: data.clipStart ?? 0,
          clipEnd: data.clipEnd ?? null,
        });
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [panel]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !demo) return;

    const { clipStart, clipEnd } = demo;
    const useSegmentLoop = clipEnd != null && clipEnd > clipStart;

    const seekToStart = () => {
      if (useSegmentLoop && video.duration && clipStart < video.duration) {
        video.currentTime = clipStart;
      } else if (useSegmentLoop) {
        video.currentTime = 0;
      }
    };

    const onTimeUpdate = () => {
      if (useSegmentLoop && video.currentTime >= clipEnd!) {
        video.currentTime = clipStart;
      }
    };

    video.addEventListener('loadedmetadata', seekToStart);
    if (useSegmentLoop) {
      video.addEventListener('timeupdate', onTimeUpdate);
    }

    return () => {
      video.removeEventListener('loadedmetadata', seekToStart);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [demo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !demo) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (isPlaying) {
            void video.play().catch(() => {});
          }
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [isPlaying, demo]);

  const handleVideoError = useCallback(() => {
    if (!demo) return;
    if (demo.url !== demo.fallbackUrl) {
      setDemo({ ...demo, url: demo.fallbackUrl });
      return;
    }
    setLoadError(true);
  }, [demo]);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  return (
    <button
      type="button"
      className={`hero-demo-video-btn${className ? ` ${className}` : ''}`}
      onClick={togglePlayback}
      aria-label={isPlaying ? `Pause ${ariaLabel}` : `Play ${ariaLabel}`}
      disabled={!demo && !loadError}
    >
      {demo ? (
        <video
          ref={videoRef}
          key={demo.url}
          className="hero-demo-video"
          src={demo.url}
          muted
          playsInline
          autoPlay
          preload="auto"
          loop={demo.clipEnd == null}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={handleVideoError}
          onLoadedData={() => {
            const video = videoRef.current;
            if (video && isPlaying) void video.play().catch(() => {});
          }}
        />
      ) : (
        <div className="hero-demo-video-placeholder" aria-hidden="true">
          {loadError ? 'Preview unavailable' : 'Loading preview…'}
        </div>
      )}
      <span
        className={`hero-demo-video-control${isPlaying ? ' hero-demo-video-control--playing' : ''}${controlClassName ? ` ${controlClassName}` : ''}`}
        aria-hidden="true"
      >
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="1" width="3.5" height="12" rx="1" />
            <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3 1.5v11l9-5.5-9-5.5z" />
          </svg>
        )}
      </span>
    </button>
  );
}
