'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      return;
    }
    if (Notification.permission !== 'default') return;

    Promise.all([
      fetch('/api/user/checklist').then((r) => r.json()),
      fetch('/api/user/status').then((r) => r.json()),
      fetch('/api/push/vapid-public-key').then((r) => r.json()),
    ]).then(([checklist, status, vapid]) => {
      if (!checklist?.checklist?.createdClip) return;
      if (status?.pushPromptDismissed) return;
      if (!vapid.publicKey) return;
      setPublicKey(vapid.publicKey);
      setVisible(true);
    });
  }, []);

  const dismiss = async () => {
    setVisible(false);
    await fetch('/api/push/subscribe', { method: 'DELETE' });
  };

  const enable = async () => {
    if (!publicKey) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        await dismiss();
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      toast.success('Notifications enabled');
      setVisible(false);
    } catch {
      toast.error('Could not enable notifications');
    }
  };

  if (!visible) return null;

  return (
    <div className="glass-card push-prompt-banner">
      <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>
        Get notified when your clips are ready — even when this tab is closed.
      </p>
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button type="button" className="vesper-btn vesper-btn-primary" onClick={() => void enable()}>
          Enable Notifications
        </button>
        <button type="button" className="vesper-btn-outline" onClick={() => void dismiss()}>
          Not now
        </button>
      </div>
    </div>
  );
}
