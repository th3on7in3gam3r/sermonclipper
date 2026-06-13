'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  acceptAllConsent,
  getConsent,
  rejectNonEssentialConsent,
  saveConsent,
  type ConsentPreferences,
} from '@/lib/consent';

export default function CookieConsent() {
  const [prefs, setPrefs] = useState<ConsentPreferences | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    setPrefs(getConsent());
  }, []);

  if (prefs) return null;

  const save = (next: ConsentPreferences) => {
    setPrefs(next);
    setShowPrefs(false);
  };

  return (
    <>
      <div className="cookie-banner" role="dialog" aria-label="Cookie preferences">
        <p>
          We use cookies to improve your experience and analyze usage. See our{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <div className="cookie-banner-actions">
          <button type="button" className="vesper-btn-outline" onClick={() => save(rejectNonEssentialConsent())}>
            Reject Non-Essential
          </button>
          <button type="button" className="vesper-btn-outline" onClick={() => setShowPrefs(true)}>
            Manage Preferences
          </button>
          <button type="button" className="vesper-btn vesper-btn-primary" onClick={() => save(acceptAllConsent())}>
            Accept All
          </button>
        </div>
      </div>

      {showPrefs && (
        <div className="cookie-modal-overlay" role="presentation" onClick={() => setShowPrefs(false)}>
          <div className="cookie-modal glass-card" role="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Cookie preferences</h3>
            <label className="cookie-toggle">
              <span>Essential (required)</span>
              <input type="checkbox" checked disabled readOnly />
            </label>
            <label className="cookie-toggle">
              <span>Analytics</span>
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
            </label>
            <label className="cookie-toggle">
              <span>Marketing</span>
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
            </label>
            <button
              type="button"
              className="vesper-btn vesper-btn-primary"
              onClick={() => save(saveConsent({ analytics, marketing }))}
            >
              Save preferences
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function CookiePreferencesLink() {
  return (
    <button
      type="button"
      className="cookie-prefs-link"
      onClick={() => {
        localStorage.removeItem('vesper_cookie_consent');
        window.location.reload();
      }}
    >
      Cookie Preferences
    </button>
  );
}
