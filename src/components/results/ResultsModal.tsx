'use client';

import { useEffect, useId, type CSSProperties, type ReactNode } from 'react';
import { useFocusTrap } from '@/lib/useFocusTrap';

type Props = {
  onClose: () => void;
  /** Render function; put the given id on the element that titles the dialog. */
  children: (titleId: string) => ReactNode;
  isMobile?: boolean;
  panelClassName?: string;
  panelStyle?: CSSProperties;
  backdropOpacity?: number;
  backdropBlur?: number;
};

/**
 * Full-screen modal shell for the results page: Escape closes, focus is
 * trapped and restored, scroll is locked, and the panel is announced as a
 * dialog labelled by its title.
 */
export default function ResultsModal({
  onClose,
  children,
  isMobile = false,
  panelClassName = 'glass-card animate-in premium-border',
  panelStyle,
  backdropOpacity = 0.9,
  backdropBlur = 24,
}: Props) {
  const titleId = useId();
  const trapRef = useFocusTrap(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: `rgba(0,0,0,${backdropOpacity})`,
        backdropFilter: `blur(${backdropBlur}px)`,
        WebkitBackdropFilter: `blur(${backdropBlur}px)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? 0 : 24,
      }}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={panelClassName}
        style={{
          width: '100%',
          maxHeight: isMobile ? '100%' : '90vh',
          height: isMobile ? '100%' : 'auto',
          borderRadius: isMobile ? 0 : 24,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          ...panelStyle,
        }}
      >
        {children(titleId)}
      </div>
    </div>
  );
}

export function ModalCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      style={{
        background: 'none',
        border: '1px solid rgb(var(--fg-rgb) / 0.1)',
        color: 'var(--text-main)',
        width: 36,
        height: 36,
        borderRadius: '50%',
        cursor: 'pointer',
        fontSize: 18,
        flexShrink: 0,
      }}
    >
      ✕
    </button>
  );
}
