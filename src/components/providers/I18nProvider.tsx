'use client';

import { useEffect, useMemo, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { useAuth } from '@clerk/nextjs';
import { initI18n } from '@/lib/i18n/config';
import {
  detectBrowserLocale,
  isAppLocale,
  LOCALE_COOKIE_KEY,
  LOCALE_STORAGE_KEY,
  RTL_LOCALES,
  type AppLocale,
} from '@/lib/i18n/resources';

function readCookieLocale(): AppLocale | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE_KEY}=([^;]+)`));
  const value = match?.[1] ? decodeURIComponent(match[1]) : null;
  return isAppLocale(value) ? value : null;
}

function readStoredLocale(): AppLocale | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return isAppLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

function initialLocale(): AppLocale {
  if (typeof window === 'undefined') return 'en';
  return readStoredLocale() || readCookieLocale() || detectBrowserLocale(navigator.language);
}

function persistLocale(locale: AppLocale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* private mode */
  }
  document.cookie = `${LOCALE_COOKIE_KEY}=${encodeURIComponent(locale)};path=/;max-age=31536000;SameSite=Lax`;
}

function applyDocumentLocale(locale: AppLocale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth();
  const [locale, setLocale] = useState<AppLocale>(initialLocale);

  useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      let next = readStoredLocale() || readCookieLocale() || detectBrowserLocale(navigator.language);

      if (isLoaded && userId) {
        try {
          const res = await fetch('/api/user/locale');
          if (res.ok) {
            const data = (await res.json()) as { locale?: string };
            if (isAppLocale(data.locale)) next = data.locale;
          }
        } catch {
          /* offline */
        }
      }

      if (cancelled) return;
      setLocale((current) => {
        if (next === current) return current;
        initI18n(next);
        persistLocale(next);
        applyDocumentLocale(next);
        return next;
      });
    };

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId]);

  useEffect(() => {
    const onLocaleChange = (event: Event) => {
      const detail = (event as CustomEvent<{ locale: AppLocale }>).detail;
      if (!isAppLocale(detail?.locale)) return;
      initI18n(detail.locale);
      setLocale(detail.locale);
      persistLocale(detail.locale);
      applyDocumentLocale(detail.locale);
    };
    window.addEventListener('vesper:locale', onLocaleChange);
    return () => window.removeEventListener('vesper:locale', onLocaleChange);
  }, []);

  const i18n = useMemo(() => initI18n(locale), [locale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export function changeAppLocale(locale: AppLocale) {
  window.dispatchEvent(new CustomEvent('vesper:locale', { detail: { locale } }));
}
