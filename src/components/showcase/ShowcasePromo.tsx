'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

const DISMISS_KEY = 'vesper-showcase-promo-dismissed';

type ShowcasePromoProps = {
  /** Public CTA for visitors; member CTA prompts opt-in for signed-in users. */
  variant: 'public' | 'member';
};

export default function ShowcasePromo({ variant }: ShowcasePromoProps) {
  const { isLoaded, userId } = useAuth();
  const [optedIn, setOptedIn] = useState(false);
  const [ready, setReady] = useState(variant === 'public');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) setDismissed(true);
  }, []);

  useEffect(() => {
    if (variant !== 'member') return;
    if (!isLoaded || !userId) {
      setReady(true);
      return;
    }

    fetch('/api/user/profile-settings')
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: { showcaseOptIn?: boolean }) => setOptedIn(Boolean(d.showcaseOptIn)))
      .catch(() => setOptedIn(false))
      .finally(() => setReady(true));
  }, [variant, isLoaded, userId]);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  if (dismissed || !ready) return null;
  if (variant === 'member' && (optedIn || !userId)) return null;

  if (variant === 'public') {
    return (
      <div className="showcase-promo showcase-promo--public">
        <div>
          <p className="showcase-promo-eyebrow">Community showcase</p>
          <p className="showcase-promo-title">See what churches are creating with Vesper</p>
          <p className="showcase-promo-copy">
            Browse real sermon reels, then share yours when you&apos;re ready.
          </p>
        </div>
        <Link href="/showcase" className="vesper-btn vesper-btn-primary showcase-promo-cta">
          View Showcase
        </Link>
      </div>
    );
  }

  return (
    <div className="showcase-promo">
      <div className="showcase-promo-main">
        <p className="showcase-promo-eyebrow">Get featured</p>
        <p className="showcase-promo-title">Share your reels on the public Showcase</p>
        <p className="showcase-promo-copy">
          Opt in once in Settings and your exported clips can appear alongside other churches on{' '}
          <Link href="/showcase" className="showcase-promo-inline">
            vesper.biblefunland.com/showcase
          </Link>
          . Turn it off anytime.
        </p>
      </div>
      <div className="showcase-promo-actions">
        <Link href="/dashboard/settings" className="vesper-btn vesper-btn-primary showcase-promo-cta">
          Opt in in Settings
        </Link>
        <Link href="/showcase" className="vesper-btn vesper-btn-outline showcase-promo-cta">
          Preview Showcase
        </Link>
        <button type="button" className="showcase-promo-dismiss" onClick={dismiss} aria-label="Dismiss">
          Not now
        </button>
      </div>
    </div>
  );
}
