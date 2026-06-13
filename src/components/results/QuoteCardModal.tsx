'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { loadBrandKit } from '@/lib/studio/brandKit';

const BG_PRESETS = [
  { id: 'violet', color: '#7c3aed' },
  { id: 'dark', color: '#0d0d14' },
  { id: 'gold', color: '#b45309' },
  { id: 'navy', color: '#1e3a5f' },
  { id: 'forest', color: '#14532d' },
  { id: 'slate', color: '#334155' },
];

interface QuoteCardModalProps {
  quote: string;
  speaker?: string;
  church?: string;
  onClose: () => void;
}

export default function QuoteCardModal({ quote, speaker, church, onClose }: QuoteCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bg, setBg] = useState(BG_PRESETS[0].color);
  const [fontSize, setFontSize] = useState(42);
  const [align, setAlign] = useState<'center' | 'left'>('center');

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = 1080;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    const kit = loadBrandKit();
    const primary = typeof kit?.primaryColor === 'string' ? kit.primaryColor : '#c4b5fd';

    ctx.fillStyle = primary;
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.fillText('LOGO', 48, 48);

    ctx.fillStyle = '#fff';
    ctx.font = `900 ${fontSize}px Outfit, sans-serif`;
    ctx.textAlign = align;
    const x = align === 'center' ? size / 2 : 80;
    wrapText(ctx, `"${quote}"`, x, size * 0.42, size - 160, fontSize * 1.25);

    ctx.font = '600 22px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    const byline = [speaker, church].filter(Boolean).join(' · ');
    if (byline) ctx.fillText(byline, x, size * 0.78);
  }, [align, bg, church, fontSize, quote, speaker]);

  useEffect(() => {
    draw();
  }, [draw]);

  const exportSize = (w: number, h: number, name: string) => {
    const src = canvasRef.current;
    if (!src) return;
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const ctx = out.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const scale = Math.max(w / src.width, h / src.height);
    ctx.drawImage(src, (w - src.width * scale) / 2, (h - src.height * scale) / 2, src.width * scale, src.height * scale);
    const link = document.createElement('a');
    link.download = name;
    link.href = out.toDataURL('image/png');
    link.click();
  };

  const downloadAll = () => {
    exportSize(1080, 1080, 'quote-instagram-1x1.png');
    exportSize(1080, 1920, 'quote-story-9x16.png');
    exportSize(1280, 720, 'quote-twitter-16x9.png');
    toast.success('Downloading all quote card sizes');
  };

  return (
    <div className="thumb-modal-overlay" onClick={onClose}>
      <div className="thumb-modal glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <h2 style={{ fontWeight: 900, marginBottom: 16 }}>Quote Card</h2>
        <canvas ref={canvasRef} style={{ width: '100%', borderRadius: 12 }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {BG_PRESETS.map((p) => (
            <button key={p.id} type="button" className="vesper-btn-outline" onClick={() => setBg(p.color)}>
              {p.id}
            </button>
          ))}
        </div>
        <label style={{ display: 'block', marginTop: 12 }}>
          Size
          <input type="range" min={28} max={64} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="button" className="vesper-btn-outline" onClick={() => setAlign('center')}>
            Center
          </button>
          <button type="button" className="vesper-btn-outline" onClick={() => setAlign('left')}>
            Left
          </button>
          <button type="button" className="vesper-btn vesper-btn-primary" onClick={downloadAll}>
            Download all sizes
          </button>
        </div>
      </div>
    </div>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word + ' ';
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, cy);
}
