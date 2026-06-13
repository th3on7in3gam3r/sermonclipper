'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

interface HelpTooltipProps {
  /** Max 2 sentences shown in the popover. */
  content: string;
  label?: string;
  className?: string;
}

export default function HelpTooltip({ content, label = 'Learn more', className }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const popoverId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [open, close]);

  return (
    <span ref={rootRef} className={`help-tooltip${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className="help-tooltip-trigger"
        aria-label={label}
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        ?
      </button>
      {open && (
        <span id={popoverId} role="dialog" className="help-tooltip-popover">
          <button type="button" className="help-tooltip-close" aria-label="Close" onClick={close}>
            ✕
          </button>
          <p className="help-tooltip-text">{content}</p>
        </span>
      )}
    </span>
  );
}
