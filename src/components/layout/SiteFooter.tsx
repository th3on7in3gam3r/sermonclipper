'use client';

import Link from 'next/link';
import { SITE_URL, SUPPORT_EMAIL } from '@/lib/siteConfig';
import { CookiePreferencesLink } from '@/components/consent/CookieConsent';
import LanguageSelector from '@/components/shared/LanguageSelector';
import { useTranslation } from 'react-i18next';

export default function SiteFooter() {
  const { t } = useTranslation();

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
          <Link href="/privacy">{t('footer.privacy')}</Link>
          <Link href="/terms">{t('footer.terms')}</Link>
          <Link href="/help">{t('footer.help')}</Link>
          <CookiePreferencesLink />
          <a href={`mailto:${SUPPORT_EMAIL}`}>{t('footer.contact')}</a>
          <a href="/sitemap.xml">{t('footer.sitemap')}</a>
        </nav>

        <div className="site-footer-lang">
          <LanguageSelector compact />
        </div>

        <p className="site-footer-copy">{t('footer.copyright')}</p>
      </div>
    </footer>
  );
}
