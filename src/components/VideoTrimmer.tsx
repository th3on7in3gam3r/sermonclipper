'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

type FFmpegInstance = {
  on: (event: string, cb: (data: { progress: number }) => void) => void;
  load: (config: { coreURL: string; wasmURL: string }) => Promise<void>;
  writeFile: (name: string, data: Uint8Array) => Promise<void>;
  readFile: (name: string) => Promise<Uint8Array | string>;
  exec: (args: string[]) => Promise<number>;
  deleteFile: (name: string) => Promise<void>;
};

interface VideoTrimmerProps {
  initialFile?: File | null;
  onTrimComplete: (trimmedFile: File, jobId: string) => void;
  onCancel: () => void;
}

const MAX_OUTPUT_MB = 500; // Presigned URLs bypass proxy — direct browser-to-R2 upload

export default function VideoTrimmer({ initialFile, onTrimComplete, onCancel }: VideoTrimmerProps) {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [inPoint, setInPoint] = useState(0);
  const [outPoint, setOutPoint] = useState(0);
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimProgress, setTrimProgress] = useState(0);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);
  const [segments, setSegments] = useState<{ start: number; end: number; sizeMB: number }[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [mode, setMode] = useState<'segments' | 'manual'>('segments');

  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<FFmpegInstance | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<'in' | 'out' | 'playhead' | null>(null);

  // Cleanup object URL on unmount to prevent massive memory leaks
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  // Load FFmpeg from local static files — completely bypasses webpack/turbopack
  useEffect(() => {
    const loadFFmpeg = async () => {
      if (ffmpegRef.current) return;
      setFfmpegLoading(true);
      try {
        // Use new Function to create a dynamic import that webpack CANNOT analyze
        // This loads our local /ffmpeg/classes.js which has the FFmpeg class
        const mod = await (new Function('return import("/ffmpeg/classes.js")'))();
        const ffmpeg = new mod.FFmpeg();
        ffmpeg.on('progress', ({ progress }: { progress: number }) => {
          setTrimProgress(Math.round(progress * 100));
        });

        // All files are same-origin from public/ffmpeg/
        await ffmpeg.load({
          coreURL: '/ffmpeg/ffmpeg-core.js',
          wasmURL: '/ffmpeg/ffmpeg-core.wasm',
          workerURL: '/ffmpeg/worker.js',
        });

        ffmpegRef.current = ffmpeg as unknown as FFmpegInstance;
        setFfmpegLoaded(true);
      } catch (err) {
        console.error('FFmpeg load failed:', err);
        toast.error('Failed to load video engine. Try refreshing.');
      } finally {
        setFfmpegLoading(false);
      }
    };
    loadFFmpeg();
  }, []);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setVideoUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selectedFile);
    });
    setFile(selectedFile);
    setInPoint(0);
    setOutPoint(0);
    setCurrentTime(0);
    setSegments([]);
    setSelectedSegment(null);
  }, []);

  // Auto-load initial file
  useEffect(() => {
    if (initialFile && !videoUrl) {
      Promise.resolve().then(() => handleFileSelect(initialFile));
    }
  }, [initialFile, videoUrl, handleFileSelect]);

  // Calculate segments when duration is known
  const handleLoadedMetadata = () => {
    if (!videoRef.current || !file) return;
    const dur = videoRef.current.duration;
    setDuration(dur);
    setOutPoint(dur);

    // Calculate how many segments needed to stay under MAX_OUTPUT_MB
    const fileSizeMB = file.size / (1024 * 1024);
    const bytesPerSecond = file.size / dur;
    const maxSecondsPerSegment = (MAX_OUTPUT_MB * 1024 * 1024) / bytesPerSecond;
    const numSegments = Math.ceil(dur / maxSecondsPerSegment);

    const segs: { start: number; end: number; sizeMB: number }[] = [];
    for (let i = 0; i < numSegments; i++) {
      const start = i * maxSecondsPerSegment;
      const end = Math.min((i + 1) * maxSecondsPerSegment, dur);
      const segDuration = end - start;
      const sizeMB = Math.round((segDuration / dur) * fileSizeMB);
      segs.push({ start, end, sizeMB });
    }
    setSegments(segs);

    // If file is already small enough, go straight to manual mode
    if (fileSizeMB <= MAX_OUTPUT_MB) {
      setMode('manual');
    }
  };

  // Trim a specific segment directly (called from segment cards)
  const trimSegment = async (start: number, end: number) => {
    if (!ffmpegRef.current || !file) return;
    const trimDuration = end - start;
    if (trimDuration < 3) { toast.error('Segment too short.'); return; }

    setIsTrimming(true);
    setTrimProgress(0);
    const trimToast = toast.loading('Trimming segment...');
    try {
      const ffmpeg = ffmpegRef.current;
      const fileBuffer = await file.arrayBuffer();
      await ffmpeg.writeFile('input.mp4', new Uint8Array(fileBuffer));
      await ffmpeg.exec(['-ss', String(start), '-i', 'input.mp4', '-t', String(trimDuration), '-c', 'copy', '-avoid_negative_ts', 'make_zero', 'output.mp4']);
      const data = await ffmpeg.readFile('output.mp4');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = new Blob([data as any], { type: 'video/mp4' });
      const trimmedFile = new File([blob], `trimmed_${file.name}`, { type: 'video/mp4' });

      if (trimmedFile.size > MAX_OUTPUT_MB * 1024 * 1024) {
        toast.error(`Segment is ${Math.round(trimmedFile.size / (1024 * 1024))}MB — over the ${MAX_OUTPUT_MB}MB limit. Try the next segment or use manual trim.`, { id: trimToast });
        setIsTrimming(false);
        return;
      }

      // eslint-disable-next-line react-hooks/purity
      const jobId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36);
      toast.success(`Trimmed ${formatTime(trimDuration)} (${Math.round(trimmedFile.size / (1024 * 1024))}MB) — uploading...`, { id: trimToast });
      onTrimComplete(trimmedFile, jobId);
      await ffmpeg.deleteFile('input.mp4');
      await ffmpeg.deleteFile('output.mp4');
    } catch (err) {
      console.error('Segment trim failed:', err);
      toast.error('Trim failed. Try manual trimming instead.', { id: trimToast });
    } finally {
      setIsTrimming(false);
    }
  };

  // Select a segment — preview the timestamp, then trim & upload
  const handleSelectSegment = async (idx: number) => {
    if (!ffmpegLoaded) {
      toast.error('Video engine still loading, please wait...');
      return;
    }
    setSelectedSegment(idx);
    const seg = segments[idx];

    // Jump the preview to the segment's start so user sees what they're trimming
    if (videoRef.current) {
      videoRef.current.currentTime = seg.start;
    }

    await trimSegment(seg.start, seg.end);
  };

  // Switch to manual trim mode for fine-tuning
  const handleManualEdit = (idx: number) => {
    const seg = segments[idx];
    setInPoint(seg.start);
    setOutPoint(seg.end);
    if (videoRef.current) videoRef.current.currentTime = seg.start;
    setMode('manual');
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
        setInPoint(Math.max(0, Math.min(time, outPoint - 1)));
      } else if (draggingRef.current === 'out') {
        setOutPoint(Math.min(duration, Math.max(time, inPoint + 1)));
      } else if (draggingRef.current === 'playhead') {
        const clamped = Math.max(inPoint, Math.min(time, outPoint));
        setCurrentTime(clamped);
        if (videoRef.current) videoRef.current.currentTime = clamped;
      }
    };
    const handleMouseUp = () => { draggingRef.current = null; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [duration, inPoint, outPoint, getTimeFromPosition]);

  const handleTimeUpdate = () => {
    if (videoRef.current && !draggingRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const getEstimatedSize = () => {
    if (!file || !duration) return '—';
    const ratio = (outPoint - inPoint) / duration;
    const mb = Math.round((file.size * ratio) / (1024 * 1024));
    return `${mb} MB`;
  };

  const isOverLimit = () => {
    if (!file || !duration) return false;
    const ratio = (outPoint - inPoint) / duration;
    return (file.size * ratio) / (1024 * 1024) > MAX_OUTPUT_MB;
  };

  // Trim
  const handleTrim = async () => {
    if (!ffmpegRef.current || !file) return;
    const trimDuration = outPoint - inPoint;
    if (trimDuration < 3) { toast.error('Clip must be at least 3 seconds.'); return; }
    if (isOverLimit()) { toast.error(`Selected range is still over ${MAX_OUTPUT_MB}MB. Shorten it.`); return; }

    setIsTrimming(true);
    setTrimProgress(0);
    try {
      const ffmpeg = ffmpegRef.current;
      // Read file as Uint8Array directly (avoids importing @ffmpeg/util which has same webpack issue)
      const fileBuffer = await file.arrayBuffer();
      await ffmpeg.writeFile('input.mp4', new Uint8Array(fileBuffer));
      await ffmpeg.exec(['-ss', String(inPoint), '-i', 'input.mp4', '-t', String(trimDuration), '-c', 'copy', '-avoid_negative_ts', 'make_zero', 'output.mp4']);
      const data = await ffmpeg.readFile('output.mp4');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = new Blob([data as any], { type: 'video/mp4' });
      const trimmedFile = new File([blob], `trimmed_${file.name}`, { type: 'video/mp4' });

      if (trimmedFile.size > MAX_OUTPUT_MB * 1024 * 1024) {
        toast.error(`Still ${Math.round(trimmedFile.size / (1024 * 1024))}MB. Select a shorter range.`);
        setIsTrimming(false);
        return;
      }

      // eslint-disable-next-line react-hooks/purity
      const jobId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36);
      toast.success(`Trimmed to ${formatTime(trimDuration)} (${Math.round(trimmedFile.size / (1024 * 1024))}MB)`);
      onTrimComplete(trimmedFile, jobId);
      await ffmpeg.deleteFile('input.mp4');
      await ffmpeg.deleteFile('output.mp4');
    } catch (err) {
      console.error('Trim failed:', err);
      toast.error('Trim failed. Try a different format or shorter range.');
    } finally {
      setIsTrimming(false);
    }
  };

  // ─── FILE PICKER (no file yet) ───
  if (!file) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✂️</div>
          <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>Video Trimmer</h2>
          <p style={{ color: '#A1A1AA', fontSize: '16px', marginBottom: '32px' }}>Select a large sermon video. We&apos;ll help you split it into uploadable segments.</p>
          <div onClick={() => document.getElementById('trimmer-input')?.click()} style={{ padding: '48px', border: '2px dashed rgba(139,92,246,0.3)', borderRadius: '20px', cursor: 'pointer', background: 'rgba(139,92,246,0.03)' }}>
            <p style={{ color: '#C4B5FD', fontSize: '15px', fontWeight: 700 }}>Click to select video</p>
            <p style={{ color: '#52525B', fontSize: '15px', marginTop: '8px' }}>Any size — stays on your device</p>
          </div>
          <input id="trimmer-input" type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
          <button onClick={onCancel} style={{ marginTop: '20px', padding: '10px 20px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#71717A', fontSize: '15px', cursor: 'pointer' }}>← Back</button>
        </div>
      </div>
    );
  }

  // ─── SEGMENT PICKER (large file, choose a segment) ───
  if (mode === 'segments' && segments.length > 1) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#fff', padding: '40px 20px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✂️</div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>Your sermon is {Math.round(file.size / (1024 * 1024))}MB</h2>
            <p style={{ color: '#A1A1AA', fontSize: '16px', lineHeight: 1.6 }}>
              We&apos;ve split it into {segments.length} segments of ~{formatTime(segments[0]?.end - segments[0]?.start)} each.<br />
              Click <b style={{ color: '#C4B5FD' }}>✂️ USE THIS</b> to trim & upload that segment instantly, or <b style={{ color: '#A1A1AA' }}>⚙</b> to fine-tune the in/out points.
            </p>
          </div>

          {/* Video preview (small) */}
          <div style={{ marginBottom: '32px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            <video ref={videoRef} src={videoUrl} onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={handleTimeUpdate} controls style={{ width: '100%', maxHeight: '240px', background: '#000' }} />
          </div>

          {/* Segment cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '32px' }}>
            {segments.map((seg, i) => {
              const isActive = selectedSegment === i;
              const isProcessing = isTrimming && isActive;
              return (
                <div
                  key={i}
                  onMouseEnter={() => {
                    // Jump preview to segment start on hover so user can see what's there
                    if (videoRef.current && !isTrimming) {
                      videoRef.current.currentTime = seg.start;
                    }
                  }}
                  style={{
                    padding: '16px', borderRadius: '14px', transition: 'all 0.2s',
                    background: isActive ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                    border: isActive ? '1px solid #8B5CF6' : '1px solid rgba(255,255,255,0.06)',
                    opacity: isTrimming && !isActive ? 0.4 : 1,
                  }}
                >
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.15em', marginBottom: '6px' }}>SEGMENT {i + 1}</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>{formatTime(seg.start)} → {formatTime(seg.end)}</div>
                  <div style={{ fontSize: '16px', color: '#71717A', marginBottom: '12px' }}>~{seg.sizeMB}MB · {formatTime(seg.end - seg.start)} long</div>

                  {isProcessing ? (
                    <div>
                      <div style={{ fontSize: '15px', color: '#C4B5FD', fontWeight: 800, marginBottom: '6px' }}>TRIMMING... {trimProgress}%</div>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${trimProgress}%`, background: 'linear-gradient(90deg, #8B5CF6, #D8B4FE)', transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleSelectSegment(i)}
                        disabled={isTrimming || !ffmpegLoaded}
                        style={{
                          flex: 1, padding: '8px', background: '#8B5CF6', border: 'none', borderRadius: '8px',
                          color: '#fff', fontSize: '16px', fontWeight: 900, letterSpacing: '0.05em',
                          cursor: (isTrimming || !ffmpegLoaded) ? 'not-allowed' : 'pointer',
                          opacity: (isTrimming || !ffmpegLoaded) ? 0.5 : 1,
                        }}
                      >
                        ✂️ USE THIS
                      </button>
                      <button
                        onClick={() => handleManualEdit(i)}
                        disabled={isTrimming}
                        style={{
                          padding: '8px 10px', background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                          color: '#A1A1AA', fontSize: '16px', fontWeight: 700, cursor: 'pointer',
                        }}
                        title="Fine-tune in/out points"
                      >
                        ⚙
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setMode('manual')} style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#A1A1AA', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
              Manual Trim Instead
            </button>
            <button onClick={onCancel} style={{ padding: '14px 20px', background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#52525B', fontSize: '15px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>

          {ffmpegLoading && <p style={{ textAlign: 'center', marginTop: '20px', color: '#8B5CF6', fontSize: '16px' }}>Loading video engine...</p>}
        </div>
      </div>
    );
  }

  // ─── MANUAL TRIMMER ───
  const inPercent = duration > 0 ? (inPoint / duration) * 100 : 0;
  const outPercent = duration > 0 ? (outPoint / duration) * 100 : 0;
  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: '#0D0D12', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px' }}>✂️</span>
          <span style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '0.25em' }}>TRIMMER</span>
          {segments.length > 1 && (
            <button onClick={() => setMode('segments')} style={{ marginLeft: '12px', padding: '4px 10px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '6px', color: '#C4B5FD', fontSize: '15px', fontWeight: 800, cursor: 'pointer' }}>
              ← SEGMENTS
            </button>
          )}
        </div>
        <button onClick={onCancel} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#A1A1AA', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>CANCEL</button>
      </div>

      {/* Video */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: '#050508' }}>
        <video ref={videoRef} src={videoUrl} onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={handleTimeUpdate} controls style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '10px' }} />
      </div>

      {/* Controls */}
      <div style={{ padding: '16px 20px 20px', background: '#0D0D12', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Info row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '16px', color: '#34D399', fontWeight: 800, fontFamily: 'monospace' }}>IN {formatTime(inPoint)}</span>
            <span style={{ fontSize: '16px', color: '#F87171', fontWeight: 800, fontFamily: 'monospace' }}>OUT {formatTime(outPoint)}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', color: '#71717A' }}>Duration: <b style={{ color: '#C4B5FD' }}>{formatTime(outPoint - inPoint)}</b></span>
            <span style={{ fontSize: '16px', color: isOverLimit() ? '#F87171' : '#71717A' }}>
              Size: <b style={{ color: isOverLimit() ? '#F87171' : '#C4B5FD' }}>{getEstimatedSize()}</b>
              {isOverLimit() && <span style={{ color: '#F87171' }}> (over limit)</span>}
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div ref={timelineRef} style={{ position: 'relative', height: '44px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', marginBottom: '16px' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${inPercent}%`, width: `${outPercent - inPercent}%`, background: isOverLimit() ? 'rgba(239,68,68,0.1)' : 'rgba(139,92,246,0.15)', borderLeft: '2px solid #34D399', borderRight: '2px solid #F87171' }} />
          <div onMouseDown={(e) => handleTimelineMouseDown(e, 'in')} style={{ position: 'absolute', top: 0, bottom: 0, left: `${inPercent}%`, width: '14px', marginLeft: '-7px', cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <div style={{ width: '4px', height: '20px', background: '#34D399', borderRadius: '2px' }} />
          </div>
          <div onMouseDown={(e) => handleTimelineMouseDown(e, 'out')} style={{ position: 'absolute', top: 0, bottom: 0, left: `${outPercent}%`, width: '14px', marginLeft: '-7px', cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <div style={{ width: '4px', height: '20px', background: '#F87171', borderRadius: '2px' }} />
          </div>
          <div onMouseDown={(e) => handleTimelineMouseDown(e, 'playhead')} style={{ position: 'absolute', top: 0, bottom: 0, left: `${playheadPercent}%`, width: '2px', background: '#fff', zIndex: 5 }}>
            <div style={{ position: 'absolute', top: '-3px', left: '-5px', width: '12px', height: '12px', background: '#fff', borderRadius: '50%' }} />
          </div>
        </div>

        {/* Action */}
        <button
          onClick={handleTrim}
          disabled={isTrimming || !ffmpegLoaded || isOverLimit()}
          className="shimmer-btn"
          style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '15px', fontWeight: 900, opacity: (isTrimming || !ffmpegLoaded || isOverLimit()) ? 0.5 : 1, cursor: (isTrimming || !ffmpegLoaded || isOverLimit()) ? 'not-allowed' : 'pointer' }}
        >
          {isTrimming ? `TRIMMING... ${trimProgress}%` : !ffmpegLoaded ? 'Loading Engine...' : isOverLimit() ? `TOO LARGE (${getEstimatedSize()}) — Shorten Range` : `✂️ TRIM & UPLOAD (${getEstimatedSize()})`}
        </button>

        {isTrimming && (
          <div style={{ marginTop: '10px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${trimProgress}%`, background: 'linear-gradient(90deg, #8B5CF6, #D8B4FE)', transition: 'width 0.3s' }} />
          </div>
        )}
      </div>
    </div>
  );
}
