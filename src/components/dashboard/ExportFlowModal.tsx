'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { LibraryItem } from '@/components/dashboard/ClipLibrary';
import { planAllowsExport } from '@/lib/plans';

type ExportFormat = '9:16' | '1:1' | '16:9';
type ExportQuality = 'standard' | 'high';

interface ExportFlowModalProps {
  item: LibraryItem;
  plan?: string;
  onClose: () => void;
  onComplete: (renderUrl: string) => void;
}

const FORMATS: { id: ExportFormat; label: string; desc: string }[] = [
  { id: '9:16', label: '9:16 Reel', desc: 'Instagram Reels, TikTok, Shorts' },
  { id: '1:1', label: '1:1 Square', desc: 'Instagram feed posts' },
  { id: '16:9', label: '16:9 Landscape', desc: 'YouTube, Facebook' },
];

export default function ExportFlowModal({ item, plan, onClose, onComplete }: ExportFlowModalProps) {
  const [step, setStep] = useState<'format' | 'rendering' | 'done'>('format');
  const [format, setFormat] = useState<ExportFormat>('9:16');
  const [quality, setQuality] = useState<ExportQuality>('standard');
  const [progress, setProgress] = useState(0);
  const [renderUrl, setRenderUrl] = useState('');
  const [etaSec, setEtaSec] = useState(120);
  const isFree = !plan || plan === 'free';
  const canExport = planAllowsExport(plan);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const startRender = async () => {
    if (!canExport) {
      toast.error('Upgrade to Creator to export reels.');
      return;
    }

    setStep('rendering');
    setProgress(5);
    toast.loading('Starting export…', { id: 'export-flow' });

    try {
      const res = await fetch('/api/render-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: item.jobId,
          videoUrl: item.finalPath || item.videoUrl,
          clip: { start: item.clipStart, end: item.clipEnd, index: item.clipIndex },
          index: item.clipIndex,
          format,
          quality,
          template: 'minimal',
          filter: 'none',
          font: 'outfit',
          animation: 'fade',
        }),
      });
      const data = await res.json();

      if (data.code === 'UPGRADE_REQUIRED') {
        toast.error(data.error || 'Upgrade required.', { id: 'export-flow' });
        setStep('format');
        return;
      }

      if (!data.shotstackId) {
        toast.error(data.error || 'Export failed to start.', { id: 'export-flow' });
        setStep('format');
        return;
      }

      pollRender(data.shotstackId);
    } catch {
      toast.error('Network error.', { id: 'export-flow' });
      setStep('format');
    }
  };

  const pollRender = async (shotstackId: string) => {
    try {
      const res = await fetch(`/api/render-status?id=${shotstackId}`);
      const data = await res.json();

      if (typeof data.percent === 'number') {
        setProgress(Math.round(data.percent));
        setEtaSec(Math.max(5, Math.round((100 - data.percent) * 1.2)));
      }

      if (data.status === 'done' && data.url) {
        setRenderUrl(data.url);
        setProgress(100);
        setStep('done');
        toast.success('Export complete!', { id: 'export-flow' });

        fetch('/api/email/render-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clipTitle: item.title,
            resultsUrl: `${window.location.origin}${`/results?jobId=${item.jobId}`}`,
          }),
        }).catch(() => {});

        return;
      }

      if (data.status === 'failed') {
        toast.error('Render failed.', { id: 'export-flow' });
        setStep('format');
        return;
      }

      setTimeout(() => pollRender(shotstackId), 3000);
    } catch {
      toast.error('Lost connection to render status.', { id: 'export-flow' });
      setStep('format');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(renderUrl);
    toast.success('Share link copied');
  };

  return (
    <div className="export-flow-overlay" role="presentation" onClick={onClose}>
      <div
        className="export-flow-card glass-card premium-border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-flow-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="export-flow-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <h2 id="export-flow-title" className="export-flow-title">
          Export clip
        </h2>
        <p className="export-flow-subtitle">{item.title}</p>

        {step === 'format' && (
          <>
            <p className="export-flow-label">Format</p>
            <div className="export-flow-options">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`export-flow-option ${format === f.id ? 'export-flow-option-active' : ''}`}
                  onClick={() => setFormat(f.id)}
                >
                  <strong>{f.label}</strong>
                  <span>{f.desc}</span>
                </button>
              ))}
            </div>

            <p className="export-flow-label">Quality</p>
            <div className="export-flow-options export-flow-options-row">
              <button
                type="button"
                className={`export-flow-option ${quality === 'standard' ? 'export-flow-option-active' : ''}`}
                onClick={() => setQuality('standard')}
              >
                <strong>Standard</strong>
                <span>Faster render</span>
              </button>
              <button
                type="button"
                className={`export-flow-option ${quality === 'high' ? 'export-flow-option-active' : ''}`}
                onClick={() => {
                  if (isFree) toast.error('High quality exports require Creator or Church Pro.');
                  else setQuality('high');
                }}
                style={{ opacity: isFree ? 0.55 : 1 }}
              >
                <strong>High Quality</strong>
                <span>{isFree ? 'Creator plan' : 'Slower, sharper'}</span>
              </button>
            </div>

            {isFree && (
              <p className="export-flow-watermark" title="Upgrade to remove watermark">
                Free exports include a subtle Vesper watermark.{' '}
                <a href="/#pricing">Upgrade to remove watermark</a>
              </p>
            )}

            <button type="button" className="vesper-btn vesper-btn-primary shimmer-effect export-flow-cta" onClick={startRender}>
              Start export
            </button>
          </>
        )}

        {step === 'rendering' && (
          <div className="export-flow-progress">
            <p>Rendering your clip…</p>
            <div className="export-flow-progress-bar">
              <div style={{ width: `${progress}%` }} />
            </div>
            <p className="export-flow-progress-meta">
              {progress}% · ~{etaSec}s remaining
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="export-flow-done">
            <p>Your clip is ready.</p>
            <a href={renderUrl} download className="vesper-btn vesper-btn-primary shimmer-effect export-flow-cta">
              Download MP4
            </a>
            <button type="button" className="vesper-btn-outline export-flow-cta" onClick={copyLink}>
              Copy shareable link
            </button>
            <button
              type="button"
              className="vesper-btn-outline export-flow-cta"
              onClick={() => onComplete(renderUrl)}
            >
              Share to social →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
