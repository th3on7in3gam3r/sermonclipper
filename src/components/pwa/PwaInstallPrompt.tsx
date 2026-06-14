'use client';

import { useEffect, useState } from 'react';
import { getClipCountForInstall } from '@/lib/pwa/offlineQueue';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const MIN_CLIPS = 3;
const DISMISS_KEY = 'vesper-pwa-install-dismissed';

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const onBip = (e: Event) => {
      const event = e as BeforeInstallPromptEvent;
      setDeferred(event);
      if (getClipCountForInstall() >= MIN_CLIPS) {
        e.preventDefault();
        setVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  useEffect(() => {
    if (!deferred) return;
    if (getClipCountForInstall() >= MIN_CLIPS) setVisible(true);
  }, [deferred]);

  useEffect(() => {
    const onClip = () => {
      if (deferred && getClipCountForInstall() >= MIN_CLIPS) setVisible(true);
    };
    window.addEventListener('vesper-clip-created', onClip);
    return () => window.removeEventListener('vesper-clip-created', onClip);
  }, [deferred]);

  if (!visible || !deferred) return null;

  const install = async () => {
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setDeferred(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="pwa-install-prompt glass-card">
      <p className="pwa-install-title">Install Vesper Studio</p>
      <p className="pwa-install-copy">Add Vesper to your home screen for one-tap access after Sunday.</p>
      <div className="pwa-install-actions">
        <button type="button" className="vesper-btn vesper-btn-primary" onClick={install}>
          Install
        </button>
        <button type="button" className="vesper-btn-outline" onClick={dismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}
