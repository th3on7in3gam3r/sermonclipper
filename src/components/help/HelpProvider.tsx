'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import HelpCenter from '@/components/help/HelpCenter';

type HelpContextValue = {
  openHelp: (slug?: string) => void;
  closeHelp: () => void;
  isOpen: boolean;
  hasHelp: boolean;
};

const HelpContext = createContext<HelpContextValue>({
  openHelp: () => {},
  closeHelp: () => {},
  isOpen: false,
  hasHelp: false,
});

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialSlug, setInitialSlug] = useState<string | null>(null);

  const openHelp = useCallback((slug?: string) => {
    setInitialSlug(slug || null);
    setIsOpen(true);
  }, []);

  const closeHelp = useCallback(() => {
    setIsOpen(false);
    setInitialSlug(null);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeHelp();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeHelp]);

  return (
    <HelpContext.Provider value={{ openHelp, closeHelp, isOpen, hasHelp: true }}>
      {children}
      {isOpen && (
        <div className="help-slideover-overlay" onClick={closeHelp}>
          <aside className="help-slideover glass-card" onClick={(e) => e.stopPropagation()}>
            <header className="help-slideover-header">
              <h2>Help Center</h2>
              <button
                type="button"
                className="help-slideover-close"
                onClick={closeHelp}
                aria-label="Close help"
              >
                ×
              </button>
            </header>
            <div className="help-slideover-body">
              <HelpCenter key={initialSlug || 'index'} mode="panel" initialSlug={initialSlug} />
            </div>
            <footer className="help-slideover-footer">
              <a href="/help" target="_blank" rel="noopener noreferrer" className="help-full-link">
                Open full help center ↗
              </a>
            </footer>
          </aside>
        </div>
      )}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  return useContext(HelpContext);
}

export function HelpFloatingButton() {
  const { openHelp } = useHelp();

  return (
    <button
      type="button"
      className="help-floating-btn"
      onClick={() => openHelp()}
      aria-label="Open help center"
      title="Help"
    >
      ?
    </button>
  );
}
