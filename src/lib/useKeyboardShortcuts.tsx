'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export type ShortcutAction = {
  key: string;
  label: string;
  action: () => void;
  allowInInput?: boolean;
};

const TIP_KEY = 'vesper_shortcuts_tip_shown';

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function useKeyboardShortcuts(actions: ShortcutAction[], enabled = true) {
  const [showHelp, setShowHelp] = useState(false);
  const [tipShown, setTipShown] = useState(true);

  useEffect(() => {
    setTipShown(localStorage.getItem(TIP_KEY) === '1');
  }, []);

  const showTipOnce = useCallback(() => {
    if (localStorage.getItem(TIP_KEY) === '1') return;
    toast('Tip: Press ? to see keyboard shortcuts', { icon: '⌨️', duration: 4000 });
    localStorage.setItem(TIP_KEY, '1');
    setTipShown(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        setShowHelp((v) => !v);
        return;
      }

      if (e.key === 'Escape') {
        setShowHelp(false);
        return;
      }

      if (isTypingTarget(e.target)) return;

      for (const item of actions) {
        const pressed = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        const bound = item.key.length === 1 ? item.key.toLowerCase() : item.key;
        if (pressed !== bound) continue;
        e.preventDefault();
        item.action();
        if (!tipShown) showTipOnce();
        break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [actions, enabled, showTipOnce, tipShown]);

  return { showHelp, setShowHelp };
}

export function ShortcutsHelpPanel({
  actions,
  onClose,
}: {
  actions: { key: string; label: string }[];
  onClose: () => void;
}) {
  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div className="shortcuts-panel glass-card" onClick={(e) => e.stopPropagation()}>
        <h3>Keyboard shortcuts</h3>
        <div className="shortcuts-grid">
          {actions.map((a) => (
            <div key={a.key} className="shortcuts-row">
              <span>{a.label}</span>
              <kbd>{a.key.toUpperCase()}</kbd>
            </div>
          ))}
          <div className="shortcuts-row">
            <span>Show this panel</span>
            <kbd>?</kbd>
          </div>
          <div className="shortcuts-row">
            <span>Close modal / panel</span>
            <kbd>Esc</kbd>
          </div>
        </div>
        <button type="button" className="vesper-btn-outline" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
