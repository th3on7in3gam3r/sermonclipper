'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseTime, formatTime } from '@/lib/parseTime';

interface CaptionSegment {
  start: number;
  end: number;
  text: string;
}

interface CaptionEditorProps {
  caption: string;
  clipStart: number;
  clipEnd: number;
  jobId?: string;
  clipIndex: number;
  onCaptionChange: (text: string) => void;
  onRestyle?: () => void;
  captionFontSize: number;
  captionColor: string;
  onFontSizeChange: (size: number) => void;
  onColorChange: (color: string) => void;
}

function buildSegments(text: string, clipStart: number, clipEnd: number): CaptionSegment[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const duration = Math.max(clipEnd - clipStart, 1);
  const slice = duration / words.length;
  return words.map((word, i) => ({
    start: clipStart + i * slice,
    end: clipStart + (i + 1) * slice,
    text: word,
  }));
}

export default function CaptionEditor({
  caption,
  clipStart,
  clipEnd,
  jobId,
  clipIndex,
  onCaptionChange,
  onRestyle,
  captionFontSize,
  captionColor,
  onFontSizeChange,
  onColorChange,
}: CaptionEditorProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);

  const segments = useMemo(
    () => buildSegments(caption, clipStart, clipEnd),
    [caption, clipStart, clipEnd]
  );

  const saveDraft = useCallback(async () => {
    if (!jobId || !dirty) return;
    try {
      await fetch('/api/studio/save-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, clipIndex, caption }),
      });
      setLastSaved(new Date());
      setDirty(false);
    } catch {
      // silent — retries on next interval
    }
  }, [jobId, clipIndex, caption, dirty]);

  useEffect(() => {
    const id = setInterval(saveDraft, 30000);
    return () => clearInterval(id);
  }, [saveDraft]);

  useEffect(() => {
    setDirty(true);
  }, [caption]);

  const updateWord = (idx: number, newWord: string) => {
    const words = caption.trim().split(/\s+/).filter(Boolean);
    words[idx] = newWord;
    onCaptionChange(words.join(' '));
    setEditingIdx(null);
  };

  return (
    <div className="caption-editor">
      <div className="caption-editor-header">
        <label className="caption-editor-label">CAPTION EDITOR</label>
        <div className="caption-editor-meta">
          {onRestyle && (
            <button type="button" className="vesper-btn-outline caption-editor-restyle" onClick={onRestyle}>
              Restyle
            </button>
          )}
          <span className="caption-editor-saved">
            {lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : 'Auto-saves every 30s'}
          </span>
        </div>
      </div>

      <div className="caption-editor-words" role="textbox" aria-label="Edit caption words">
        {segments.length === 0 ? (
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Add a caption below the preview.</span>
        ) : (
          segments.map((seg, idx) =>
            editingIdx === idx ? (
              <input
                key={idx}
                autoFocus
                className="caption-editor-word-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => updateWord(idx, editValue.trim() || seg.text)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') updateWord(idx, editValue.trim() || seg.text);
                  if (e.key === 'Escape') setEditingIdx(null);
                }}
              />
            ) : (
              <button
                key={idx}
                type="button"
                className="caption-editor-word"
                onClick={() => {
                  setEditingIdx(idx);
                  setEditValue(seg.text);
                }}
              >
                {seg.text}
              </button>
            )
          )
        )}
      </div>

      <div className="caption-editor-style-row">
        <label>
          Font size
          <input
            type="range"
            min={14}
            max={32}
            value={captionFontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
          />
          <span>{captionFontSize}px</span>
        </label>
        <label>
          Color
          <input type="color" value={captionColor} onChange={(e) => onColorChange(e.target.value)} />
        </label>
      </div>

      <div className="caption-editor-timeline" aria-label="Caption timeline">
        {segments.map((seg, idx) => (
          <button
            key={idx}
            type="button"
            className="caption-editor-timeline-segment"
            title={`${formatTime(seg.start)} – ${formatTime(seg.end)}: ${seg.text}`}
            onClick={() => {
              setEditingIdx(idx);
              setEditValue(seg.text);
            }}
          >
            <span className="caption-editor-timeline-time">{formatTime(seg.start)}</span>
            <span className="caption-editor-timeline-word">{seg.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
