'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { vesperClerkAppearance } from '@/lib/clerkAppearance';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { useHeroCtaTest } from '@/lib/useHeroCtaTest';

const NAV_LINKS = [
  { href: '/how-it-works', label: 'How it Works' },
  { href: '/for-churches', label: 'For Churches' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
] as const;

function AuthActions({ stacked, onNavigate }: { stacked?: boolean; onNavigate?: () => void }) {
  const { isLoaded, userId } = useAuth();
  const { label, onCtaClick } = useHeroCtaTest(userId);

  const wrapClass = stacked ? 'landing-nav-mobile-auth' : 'landing-nav-actions';

  if (isLoaded && userId) {
    return (
      <div className={wrapClass}>
        <div className="landing-nav-user-row">
          <Link href="/dashboard" className="landing-nav-studio-btn" onClick={onNavigate}>
            Go to Studio
          </Link>
          <UserButton
            appearance={vesperClerkAppearance}
            userProfileProps={{ appearance: vesperClerkAppearance }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={wrapClass}>
      <SignInButton mode="modal" appearance={vesperClerkAppearance} forceRedirectUrl="/dashboard">
        <button
          type="button"
          className="vesper-btn vesper-btn-outline landing-nav-ghost"
          onClick={onNavigate}
        >
          Log In
        </button>
      </SignInButton>
      <SignUpButton
        mode="modal"
        appearance={vesperClerkAppearance}
        forceRedirectUrl="/dashboard?onboarding=1"
      >
        <button
          type="button"
          className="vesper-btn vesper-btn-primary shimmer-effect landing-nav-cta"
          onClick={() => {
            onCtaClick();
            onNavigate?.();
          }}
        >
          {label}
        </button>
      </SignUpButton>
    </div>
  );
}

export default function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="landing-nav">
      <div className="landing-nav-inner">
        <Link href="/" className="landing-nav-brand" onClick={closeMenu}>
          <img src="/vesper-logo-icon.png" alt="VESPER" className="landing-nav-logo" />
          <span className="landing-nav-wordmark landing-nav-wordmark--desktop">
            <span className="landing-nav-wordmark-accent">VES</span>PER
          </span>
        </Link>

        <nav className="landing-nav-links landing-nav-links--desktop" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="landing-nav-link">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="landing-nav-actions landing-nav-actions--desktop">
          <ThemeToggle />
          <AuthActions />
        </div>

        <button
          type="button"
          className="landing-nav-menu-btn"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className={`landing-nav-menu-icon${menuOpen ? ' landing-nav-menu-icon--open' : ''}`} />
        </button>
      </div>

      {menuOpen && (
        <div className="landing-nav-mobile-panel">
          <nav className="landing-nav-mobile-links" aria-label="Mobile primary">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="landing-nav-mobile-link" onClick={closeMenu}>
                {link.label}
              </Link>
            ))}
          </nav>
          <AuthActions stacked onNavigate={closeMenu} />
        </div>
      )}
    </header>
  );
}
