'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { STUDIO_FONTS } from '@/lib/studio/constants';
import { loadBrandKit } from '@/lib/studio/brandKit';
import {
  downloadThumbnailZip,
  renderThumbnailToBlob,
  THUMBNAIL_EXPORT_SIZES,
  type ThumbnailExportKey,
} from '@/lib/thumbnailFrames';

export type CanvasTextLayer = {
  id: string;
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  background: boolean;
  bgColor: string;
  outline: boolean;
  zIndex: number;
};

export type CanvasGraphicLayer = {
  id: string;
  type: 'logo' | 'banner' | 'badge';
  x: number;
  y: number;
  text: string;
  zIndex: number;
};

export type CanvasLayer = CanvasTextLayer | CanvasGraphicLayer;

const CURATED_FONTS = STUDIO_FONTS.slice(0, 10);
const BADGE_OPTIONS = ['Watch Now', 'New Message'] as const;

type HistoryState = { layers: CanvasLayer[]; selectedId: string | null };

interface ThumbnailCanvasEditorProps {
  baseFrameUrl: string;
  clipTitle: string;
  seriesName?: string;
  onSetReelCover?: (dataUrl: string) => void;
}

function drawLayers(ctx: CanvasRenderingContext2D, w: number, h: number, layers: CanvasLayer[]) {
  const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);
  for (const layer of sorted) {
    if (layer.type === 'text') {
      ctx.save();
      ctx.font = `${layer.fontSize}px ${layer.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const x = (layer.x / 100) * w;
      const y = (layer.y / 100) * h;
      const metrics = ctx.measureText(layer.text);
      const pad = 12;
      const boxW = metrics.width + pad * 2;
      const boxH = layer.fontSize + pad;

      if (layer.background) {
        ctx.fillStyle = layer.bgColor;
        ctx.fillRect(x - boxW / 2, y - boxH / 2, boxW, boxH);
      }
      if (layer.outline) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = Math.max(3, layer.fontSize / 12);
        ctx.strokeText(layer.text, x, y);
      }
      ctx.fillStyle = layer.color;
      ctx.fillText(layer.text, x, y);
      ctx.restore();
    } else if (layer.type === 'logo') {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect((layer.x / 100) * w, (layer.y / 100) * h, w * 0.12, h * 0.08);
      ctx.fillStyle = '#8B5CF6';
      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.fillText('LOGO', (layer.x / 100) * w + w * 0.06, (layer.y / 100) * h + h * 0.04);
      ctx.restore();
    } else if (layer.type === 'banner') {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, h * 0.78, w, h * 0.22);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(h * 0.04)}px Outfit, sans-serif`;
      ctx.fillText(layer.text, w * 0.05, h * 0.88);
      ctx.restore();
    } else if (layer.type === 'badge') {
      ctx.save();
      const bx = (layer.x / 100) * w;
      const by = (layer.y / 100) * h;
      ctx.fillStyle = '#8B5CF6';
      ctx.fillRect(bx, by, w * 0.28, h * 0.06);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(h * 0.028)}px Outfit, sans-serif`;
      ctx.fillText(layer.text, bx + w * 0.04, by + h * 0.038);
      ctx.restore();
    }
  }
}

export default function ThumbnailCanvasEditor({
  baseFrameUrl,
  clipTitle,
  seriesName,
  onSetReelCover,
}: ThumbnailCanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseImgRef = useRef<HTMLImageElement | null>(null);
  const [layers, setLayers] = useState<CanvasLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<ThumbnailExportKey>('youtube');
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const [textDraft, setTextDraft] = useState(clipTitle);
  const [fontFamily, setFontFamily] = useState<string>(CURATED_FONTS[0].family);
  const [fontSize, setFontSize] = useState(48);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textBg, setTextBg] = useState(false);
  const [textOutline, setTextOutline] = useState(true);

  const undo = () => {
    if (historyIdx <= 0) return;
    const prev = history[historyIdx - 1];
    setLayers(prev.layers);
    setSelectedId(prev.selectedId);
    setHistoryIdx(historyIdx - 1);
  };

  const redo = () => {
    if (historyIdx >= history.length - 1) return;
    const next = history[historyIdx + 1];
    setLayers(next.layers);
    setSelectedId(next.selectedId);
    setHistoryIdx(historyIdx + 1);
  };

  const pushHistory = (nextLayers: CanvasLayer[], nextSelected: string | null) => {
    const snap: HistoryState = { layers: nextLayers, selectedId: nextSelected };
    setHistory((prev) => [...prev.slice(0, historyIdx + 1), snap]);
    setHistoryIdx((i) => i + 1);
  };

  useEffect(() => {
    const kit = loadBrandKit();
    const kitFont = STUDIO_FONTS.find((f) => f.id === kit?.font);
    if (kitFont) setFontFamily(kitFont.family);
    if (typeof kit?.primaryColor === 'string') setTextColor(kit.primaryColor as string);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      baseImgRef.current = img;
      redraw();
    };
    img.src = baseFrameUrl;
  }, [baseFrameUrl]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = baseImgRef.current;
    if (!canvas || !img) return;
    const { width, height } = THUMBNAIL_EXPORT_SIZES[previewSize];
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = Math.max(width / img.width, height / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);
    drawLayers(ctx, width, height, layers);

    if (selectedId) {
      const layer = layers.find((l) => l.id === selectedId);
      if (layer) {
        ctx.strokeStyle = 'rgba(139,92,246,0.8)';
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(width * 0.33, 0, width * 0.34, height);
        ctx.strokeRect(0, height * 0.33, width, height * 0.34);
        ctx.setLineDash([]);
      }
    }
  }, [layers, previewSize, selectedId]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey && historyIdx < history.length - 1) {
          const next = history[historyIdx + 1];
          setLayers(next.layers);
          setSelectedId(next.selectedId);
          setHistoryIdx(historyIdx + 1);
        } else if (!e.shiftKey && historyIdx > 0) {
          const prev = history[historyIdx - 1];
          setLayers(prev.layers);
          setSelectedId(prev.selectedId);
          setHistoryIdx(historyIdx - 1);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [history, historyIdx]);

  const addTextLayer = () => {
    const layer: CanvasTextLayer = {
      id: crypto.randomUUID(),
      type: 'text',
      x: 50,
      y: 50,
      text: textDraft || clipTitle,
      fontFamily,
      fontSize,
      color: textColor,
      background: textBg,
      bgColor: 'rgba(0,0,0,0.55)',
      outline: textOutline,
      zIndex: layers.length,
    };
    const next = [...layers, layer];
    setLayers(next);
    setSelectedId(layer.id);
    pushHistory(next, layer.id);
  };

  const addGraphic = (type: CanvasGraphicLayer['type'], text: string) => {
    const layer: CanvasGraphicLayer = {
      id: crypto.randomUUID(),
      type,
      x: type === 'logo' ? 4 : type === 'badge' ? 68 : 0,
      y: type === 'logo' ? 4 : type === 'badge' ? 6 : 78,
      text,
      zIndex: layers.length,
    };
    const next = [...layers, layer];
    setLayers(next);
    setSelectedId(layer.id);
    pushHistory(next, layer.id);
  };

  const moveLayer = (id: string, delta: number) => {
    setLayers((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, zIndex: l.zIndex + delta } : l));
      pushHistory(next, selectedId);
      return next;
    });
  };

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (e.type === 'pointerdown') {
      const hit = [...layers].reverse().find((l) => Math.abs(l.x - x) < 8 && Math.abs(l.y - y) < 8);
      setSelectedId(hit?.id ?? null);
      setDraggingId(hit?.id ?? null);
    } else if (e.type === 'pointermove' && draggingId) {
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== draggingId) return l;
          const snapX = Math.abs(x - 50) < 3 ? 50 : Math.abs(x - 33.33) < 3 ? 33.33 : Math.abs(x - 66.66) < 3 ? 66.66 : x;
          const snapY = Math.abs(y - 50) < 3 ? 50 : Math.abs(y - 33.33) < 3 ? 33.33 : Math.abs(y - 66.66) < 3 ? 66.66 : y;
          return { ...l, x: snapX, y: snapY };
        })
      );
    } else if (e.type === 'pointerup') {
      if (draggingId) pushHistory(layers, selectedId);
      setDraggingId(null);
    }
  };

  const exportAll = async () => {
    const img = baseImgRef.current;
    if (!img) return;
    const blobs = {} as Record<ThumbnailExportKey, Blob>;
    for (const key of Object.keys(THUMBNAIL_EXPORT_SIZES) as ThumbnailExportKey[]) {
      const { width, height } = THUMBNAIL_EXPORT_SIZES[key];
      blobs[key] = await renderThumbnailToBlob(img, width, height, (ctx, w, h) =>
        drawLayers(ctx, w, h, layers)
      );
    }
    await downloadThumbnailZip(blobs, clipTitle.replace(/\s+/g, '-').slice(0, 40) || 'thumbnail');
  };

  const setReelCover = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onSetReelCover) return;
    onSetReelCover(canvas.toDataURL('image/jpeg', 0.92));
  };

  return (
    <div className="thumb-canvas-editor">
      <div className="thumb-canvas-layout">
        <div className="thumb-canvas-preview-wrap">
          <canvas
            ref={canvasRef}
            className="thumb-canvas-preview"
            onPointerDown={handlePointer}
            onPointerMove={handlePointer}
            onPointerUp={handlePointer}
          />
        </div>

        <div className="thumb-canvas-tools">
          <div className="thumb-canvas-toolbar">
            <button type="button" className="vesper-btn-outline" onClick={undo}>
              Undo
            </button>
            <button type="button" className="vesper-btn-outline" onClick={redo}>
              Redo
            </button>
            <button type="button" className="vesper-btn-outline" onClick={() => selectedId && moveLayer(selectedId, 1)}>
              Forward
            </button>
            <button type="button" className="vesper-btn-outline" onClick={() => selectedId && moveLayer(selectedId, -1)}>
              Back
            </button>
          </div>

          <label className="thumb-tool-label">Preview size</label>
          <div className="thumb-size-tabs">
            {(Object.keys(THUMBNAIL_EXPORT_SIZES) as ThumbnailExportKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`vesper-btn-outline${previewSize === key ? ' thumb-size-tab--active' : ''}`}
                onClick={() => setPreviewSize(key)}
              >
                {THUMBNAIL_EXPORT_SIZES[key].label.split(' ')[0]}
              </button>
            ))}
          </div>

          <label className="thumb-tool-label">Text layer</label>
          <input className="vesper-input" value={textDraft} onChange={(e) => setTextDraft(e.target.value)} />
          <select className="vesper-input" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
            {CURATED_FONTS.map((f) => (
              <option key={f.id} value={f.family}>
                {f.name}
              </option>
            ))}
          </select>
          <label className="thumb-tool-row">
            Size
            <input type="range" min={24} max={96} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
          </label>
          <label className="thumb-tool-row">
            Color
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
          </label>
          <label className="thumb-tool-check">
            <input type="checkbox" checked={textBg} onChange={(e) => setTextBg(e.target.checked)} /> Background pill
          </label>
          <label className="thumb-tool-check">
            <input type="checkbox" checked={textOutline} onChange={(e) => setTextOutline(e.target.checked)} /> Outline / shadow
          </label>
          <button type="button" className="vesper-btn-outline" onClick={addTextLayer}>
            Add text box
          </button>

          <label className="thumb-tool-label">Graphics</label>
          <div className="thumb-graphic-btns">
            <button type="button" className="vesper-btn-outline" onClick={() => addGraphic('logo', 'Logo')}>
              Church logo
            </button>
            <button
              type="button"
              className="vesper-btn-outline"
              onClick={() => addGraphic('banner', seriesName || clipTitle)}
            >
              Series banner
            </button>
            {BADGE_OPTIONS.map((b) => (
              <button key={b} type="button" className="vesper-btn-outline" onClick={() => addGraphic('badge', b)}>
                {b}
              </button>
            ))}
          </div>

          <div className="thumb-export-btns">
            <button type="button" className="vesper-btn vesper-btn-primary" onClick={exportAll}>
              Download All Sizes
            </button>
            {onSetReelCover && (
              <button type="button" className="vesper-btn-outline" onClick={setReelCover}>
                Set as Reel Cover
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
