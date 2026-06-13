'use client';

import { useState, useRef, useCallback } from 'react';
import { MAX_DIRECT_UPLOAD_LABEL } from '@/lib/uploadLimits';

function UploadIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="8" y="28" width="48" height="28" rx="6" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M32 8v28M32 8l-10 10M32 8l10 10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22 48h20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

interface HeroUploadZoneProps {
  isMobile: boolean;
  onFileSelect: (file: File) => void;
}

export default function HeroUploadZone({ isMobile, onFileSelect }: HeroUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  const zoneClass = ['hero-upload-zone', 'animate-in', isDragging ? 'hero-upload-zone--dragging' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        id="video-upload"
        accept="video/mp4,video/quicktime,video/webm,audio/mpeg,audio/mp4,audio/aac,.mp3,.m4a,.aac"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
          e.target.value = '';
        }}
      />

      <div
        id="upload"
        className={zoneClass}
        role="button"
        tabIndex={0}
        aria-label="Upload sermon video file"
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ animationDelay: '0.2s' }}
      >
        <div className="hero-upload-icon-wrap">
          <UploadIcon size={isMobile ? 40 : 48} />
        </div>

        <p className="hero-upload-headline">Drop your sermon here to get started</p>
        <p className="hero-upload-sub">
          or click to browse — MP4, MOV, WEBM, MP3, or M4A up to {MAX_DIRECT_UPLOAD_LABEL}
        </p>

        <div className="hero-upload-badges">
          <span className="vesper-badge badge-violet">Best for exports</span>
          <span className="vesper-badge badge-gold">Up to {MAX_DIRECT_UPLOAD_LABEL} direct</span>
        </div>
      </div>
    </>
  );
}
