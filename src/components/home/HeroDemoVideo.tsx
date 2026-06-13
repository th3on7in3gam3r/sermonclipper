'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface HeroDemoVideoProps {
  src: string;
  className?: string;
  controlClassName?: string;
  ariaLabel: string;
}

export default function HeroDemoVideo({ src, className, controlClassName, ariaLabel }: HeroDemoVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
  }, [isPlaying]);

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
    >
      <video
        ref={videoRef}
        className="hero-demo-video"
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
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
