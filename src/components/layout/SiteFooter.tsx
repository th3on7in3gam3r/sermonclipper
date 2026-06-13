import Link from 'next/link';
import { SITE_URL, SUPPORT_EMAIL } from '@/lib/siteConfig';
import { CookiePreferencesLink } from '@/components/consent/CookieConsent';

export default function SiteFooter() {
  return (
    <footer className="site-footer glass-card">
      <div className="site-footer-inner">
        <Link href="/" className="site-footer-brand">
          <img src="/vesper-logo-icon.png" alt="Vesper Studio logo" className="site-footer-logo" />
          <span className="site-footer-wordmark">
            <span className="site-footer-wordmark-accent">VES</span>PER
          </span>
        </Link>

        <nav className="site-footer-links" aria-label="Footer">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <CookiePreferencesLink />
          <a href={`mailto:${SUPPORT_EMAIL}`}>Contact / Support</a>
          <a href="/sitemap.xml">Sitemap</a>
        </nav>

        <p className="site-footer-copy">© 2025 Vesper Studio. All rights reserved.</p>
      </div>
    </footer>
  );
}
