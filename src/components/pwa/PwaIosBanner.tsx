'use client';

import { useEffect, useState } from 'react';

function isIosSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua);
  const webkit = /WebKit/.test(ua);
  const notChrome = !/CriOS|FxiOS/.test(ua);
  return ios && webkit && notChrome;
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

const DISMISS_KEY = 'vesper-ios-install-dismissed';

export function PwaIosBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isIosSafari() || isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="pwa-ios-banner">
      <p>
        <strong>Add Vesper to your Home Screen:</strong> tap Share → Add to Home Screen
      </p>
      <button
        type="button"
        className="pwa-ios-dismiss"
        aria-label="Dismiss"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, '1');
          setShow(false);
        }}
      >
        ✕
      </button>
    </div>
  );
}
