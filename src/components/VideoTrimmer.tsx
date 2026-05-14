'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import toast from 'react-hot-toast';

interface VideoTrimmerProps {
  onTrimComplete: (trimmedFile: File, jobId: string) => void;
  onCancel: () => void;
}

export default function VideoTrimmer({ onTrimComplete, onCancel }: VideoTrimmerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [inPoint, setInPoint] = useState(0);
  const [outPoint, setOutPoint] = useState(0);
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimProgress, setTrimProgress] = useState(0);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<'in' | 'out' | 'playhead' | null>(null);

  // Load FFmpeg on mount
  useEffect(() => {
    const loadFFmpeg = async () => {
      if (ffmpegRef.current) return;
      setFfmpegLoading(true);
      try {
        const ffmpeg = new FFmpeg();
        ffmpeg.on('progress', ({ progress }) => {
          setTrimProgress(Math.round(progress * 100));
        });
        await ffmpeg.load({
          coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
          wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
        });
        ffmpegRef.current = ffmpeg;
        setFfmpegLoaded(true);
      } catch (err) {
        console.error('FFmpeg load failed:', err);
        toast.error('Failed to load video engine. Please refresh and try again.');
      } finally {
        setFfmpegLoading(false);
      }
    };
    loadFFmpeg();
  }, []);

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setVideoUrl(url);
    setInPoint(0);
    setOutPoint(0);
    setCurrentTime(0);
  };

  // When video metadata loads
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setOutPoint(dur);
      updateEstimatedSize(0, dur, file?.size || 0, dur);
    }
  };

  // Estimate trimmed file size
  const updateEstimatedSize = (start: number, end: number, totalBytes: number, totalDuration: number) => {
    if (totalDuration <= 0) return;
    const ratio = (end - start) / totalDuration;
    const estimated = totalBytes * ratio;
    if (estimated > 1024 * 1024 * 1024) {
      setEstimatedSize(`~${(estimated / (1024 * 1024 * 1024)).toFixed(1)} GB`);
    } else {
      setEstimatedSize(`~${Math.round(estimated / (1024 * 1024))} MB`);
    }
  };

  // Timeline interaction
  const getTimeFromPosition = useCallback((clientX: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (x / rect.width) * duration;
  }, [duration]);

  const handleTimelineMouseDown = (e: React.MouseEvent, type: 'in' | 'out' | 'playhead') => {
    e.preventDefault();
    draggingRef.current = type;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const time = getTimeFromPosition(e.clientX);

      if (draggingRef.current === 'in') {
        const newIn = Math.min(time, outPoint - 1);
        setInPoint(Math.max(0, newIn));
        updateEstimatedSize(Math.max(0, newIn), outPoint, file?.size || 0, duration);
      } else if (draggingRef.current === 'out') {
        const newOut = Math.max(time, inPoint + 1);
        setOutPoint(Math.min(duration, newOut));
        updateEstimatedSize(inPoint, Math.min(duration, newOut), file?.size || 0, duration);
      } else if (draggingRef.current === 'playhead') {
        const clamped = Math.max(inPoint, Math.min(time, outPoint));
        setCurrentTime(clamped);
        if (videoRef.current) videoRef.current.currentTime = clamped;
      }
    };

    const handleMouseUp = () => {
      draggingRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [duration, inPoint, outPoint, file, getTimeFromPosition]);

  // Video time update
  const handleTimeUpdate = () => {
    if (videoRef.current && !draggingRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Seek to in/out points
  const seekToIn = () => { if (videoRef.current) videoRef.current.currentTime = inPoint; };
  const seekToOut = () => { if (videoRef.current) videoRef.current.currentTime = outPoint; };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Trim the video
  const handleTrim = async () => {
    if (!ffmpegRef.current || !file) return;

    const trimDuration = outPoint - inPoint;
    if (trimDuration < 3) {
      toast.error('Clip must be at least 3 seconds long.');
      return;
    }

    setIsTrimming(true);
    setTrimProgress(0);

    try {
      const ffmpeg = ffmpegRef.current;
      const inputName = 'input.mp4';
      const outputName = 'trimmed.mp4';

      // Write input file to FFmpeg virtual filesystem
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Trim using stream copy (instant, no re-encoding)
      await ffmpeg.exec([
        '-ss', String(inPoint),
        '-i', inputName,
        '-t', String(trimDuration),
        '-c', 'copy',
        '-avoid_negative_ts', 'make_zero',
        outputName,
      ]);

      // Read the output
      const data = await ffmpeg.readFile(outputName);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const trimmedBlob = new Blob([data as any], { type: 'video/mp4' });
      const trimmedFile = new File([trimmedBlob], `trimmed_${file.name}`, { type: 'video/mp4' });

      // Check if trimmed file is under 100MB
      if (trimmedFile.size > 100 * 1024 * 1024) {
        toast.error(`Trimmed file is still ${Math.round(trimmedFile.size / (1024 * 1024))}MB. Try selecting a shorter segment (under 100MB).`);
        setIsTrimming(false);
        return;
      }

      const jobId = Math.random().toString(36).substring(7);
      toast.success(`Trimmed to ${formatTime(trimDuration)} (${Math.round(trimmedFile.size / (1024 * 1024))}MB)`);
      onTrimComplete(trimmedFile, jobId);

      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (err) {
      console.error('Trim failed:', err);
      toast.error('Trim failed. The video format may not be supported. Try converting to MP4 first.');
    } finally {
      setIsTrimming(false);
    }
  };

  // No file selected — show file picker
  if (!file) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>
          <div style={{ marginBottom: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✂️</div>
            <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>Video Trimmer</h2>
            <p style={{ color: '#A1A1AA', fontSize: '15px', lineHeight: 1.6 }}>
              Select a sermon video to trim. Cut it down to the section you want, then upload the trimmed version.
            </p>
          </div>

          {/* FFmpeg loading status */}
          {ffmpegLoading && (
            <div style={{ marginBottom: '24px', padding: '12px 20px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px' }}>
              <p style={{ color: '#C4B5FD', fontSize: '12px', fontWeight: 700 }}>Loading video engine...</p>
            </div>
          )}

          <div
            onClick={() => document.getElementById('trimmer-file-input')?.click()}
            style={{
              padding: '60px 40px',
              border: '2px dashed rgba(139,92,246,0.3)',
              borderRadius: '24px',
              cursor: 'pointer',
              background: 'rgba(139,92,246,0.03)',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
            <p style={{ color: '#fff', fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>Select Video File</p>
            <p style={{ color: '#52525B', fontSize: '13px' }}>MP4, MOV, WEBM — Any size</p>
            <p style={{ color: '#8B5CF6', fontSize: '11px', marginTop: '12px', fontWeight: 700 }}>
              The file stays on your device until you trim & upload
            </p>
          </div>

          <input
            id="trimmer-file-input"
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
          />

          <button
            onClick={onCancel}
            style={{ marginTop: '24px', padding: '12px 24px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#71717A', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Trimmer UI
  const trimDuration = outPoint - inPoint;
  const inPercent = (inPoint / duration) * 100;
  const outPercent = (outPoint / duration) * 100;
  const playheadPercent = (currentTime / duration) * 100;

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#0D0D12', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '16px' }}>✂️</span>
          <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '0.3em' }}>VESPER TRIMMER</span>
        </div>
        <button onClick={onCancel} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#A1A1AA', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
          ✕ CANCEL
        </button>
      </div>

      {/* Video Preview */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#050508', position: 'relative' }}>
        <video
          ref={videoRef}
          src={videoUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          controls
          style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        />
      </div>

      {/* Timeline & Controls */}
      <div style={{ padding: '20px 24px 24px', background: '#0D0D12', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Time display */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={seekToIn} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '6px 12px', color: '#34D399', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
              IN: {formatTime(inPoint)}
            </button>
            <button onClick={seekToOut} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '6px 12px', color: '#F87171', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
              OUT: {formatTime(outPoint)}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#71717A' }}>Duration: <b style={{ color: '#C4B5FD' }}>{formatTime(trimDuration)}</b></span>
            <span style={{ fontSize: '11px', color: '#71717A' }}>Size: <b style={{ color: trimDuration > 0 ? '#C4B5FD' : '#71717A' }}>{estimatedSize}</b></span>
          </div>
        </div>

        {/* Timeline scrubber */}
        <div
          ref={timelineRef}
          style={{ position: 'relative', height: '48px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', overflow: 'hidden' }}
        >
          {/* Selected region */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${inPercent}%`, width: `${outPercent - inPercent}%`, background: 'rgba(139,92,246,0.15)', borderLeft: '2px solid #8B5CF6', borderRight: '2px solid #8B5CF6' }} />

          {/* In handle */}
          <div
            onMouseDown={(e) => handleTimelineMouseDown(e, 'in')}
            style={{ position: 'absolute', top: 0, bottom: 0, left: `${inPercent}%`, width: '14px', marginLeft: '-7px', cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
          >
            <div style={{ width: '4px', height: '24px', background: '#34D399', borderRadius: '2px' }} />
          </div>

          {/* Out handle */}
          <div
            onMouseDown={(e) => handleTimelineMouseDown(e, 'out')}
            style={{ position: 'absolute', top: 0, bottom: 0, left: `${outPercent}%`, width: '14px', marginLeft: '-7px', cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
          >
            <div style={{ width: '4px', height: '24px', background: '#F87171', borderRadius: '2px' }} />
          </div>

          {/* Playhead */}
          <div
            onMouseDown={(e) => handleTimelineMouseDown(e, 'playhead')}
            style={{ position: 'absolute', top: 0, bottom: 0, left: `${playheadPercent}%`, width: '2px', background: '#fff', zIndex: 5 }}
          >
            <div style={{ position: 'absolute', top: '-4px', left: '-5px', width: '12px', height: '12px', background: '#fff', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }} />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button
            onClick={() => { setFile(null); setVideoUrl(''); }}
            style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#A1A1AA', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            Choose Different File
          </button>
          <button
            onClick={handleTrim}
            disabled={isTrimming || !ffmpegLoaded}
            className="shimmer-btn"
            style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '13px', fontWeight: 900, opacity: (isTrimming || !ffmpegLoaded) ? 0.5 : 1, cursor: (isTrimming || !ffmpegLoaded) ? 'wait' : 'pointer' }}
          >
            {isTrimming ? `TRIMMING... ${trimProgress}%` : ffmpegLoaded ? `✂️ TRIM & UPLOAD (${estimatedSize})` : 'Loading Engine...'}
          </button>
        </div>

        {/* Progress bar during trim */}
        {isTrimming && (
          <div style={{ marginTop: '12px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${trimProgress}%`, background: 'linear-gradient(90deg, #8B5CF6, #D8B4FE)', transition: 'width 0.3s ease' }} />
          </div>
        )}
      </div>
    </div>
  );
}
