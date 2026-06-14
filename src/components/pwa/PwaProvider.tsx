'use client';

import { useEffect, useState } from 'react';
import { flushOfflineQueue } from '@/lib/pwa/offlineQueue';
import { PwaInstallPrompt } from './PwaInstallPrompt';
import { PwaIosBanner } from './PwaIosBanner';
import { PwaOfflineBanner } from './PwaOfflineBanner';

export default function PwaProvider({ children }: { children: React.ReactNode }) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        registration.update().catch(() => {});
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      })
      .catch((err) => console.warn('[PWA] SW registration failed:', err));

    const onOnline = () => {
      setOffline(false);
      void flushOfflineQueue();
    };
    const onOffline = () => setOffline(true);

    const onSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'VESPER_SYNC_OFFLINE_QUEUE') {
        void flushOfflineQueue();
      }
      if (event.data?.type === 'VESPER_NAVIGATE' && event.data.url) {
        window.location.href = event.data.url;
      }
    };

    setOffline(!navigator.onLine);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    navigator.serviceWorker.addEventListener('message', onSwMessage);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      navigator.serviceWorker.removeEventListener('message', onSwMessage);
    };
  }, []);

  return (
    <>
      {children}
      <PwaOfflineBanner offline={offline} />
      <PwaInstallPrompt />
      <PwaIosBanner />
    </>
  );
}
