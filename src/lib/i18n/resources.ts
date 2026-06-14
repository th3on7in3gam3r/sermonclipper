import en from '../../../locales/en.json';
import es from '../../../locales/es.json';
import pt from '../../../locales/pt.json';
import fr from '../../../locales/fr.json';
import ko from '../../../locales/ko.json';
import ar from '../../../locales/ar.json';

export const SUPPORTED_LOCALES = ['en', 'es', 'pt', 'fr', 'ko', 'ar'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  ko: '한국어',
  ar: 'العربية',
};

export const RTL_LOCALES = new Set<AppLocale>(['ar']);

export const resources = {
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
  fr: { translation: fr },
  ko: { translation: ko },
  ar: { translation: ar },
} as const;

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return Boolean(value && SUPPORTED_LOCALES.includes(value as AppLocale));
}

export function detectBrowserLocale(acceptLanguage?: string | null): AppLocale {
  if (!acceptLanguage) return 'en';
  const codes = acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const code of codes) {
    const base = code.split('-')[0];
    if (isAppLocale(code)) return code;
    if (isAppLocale(base)) return base;
  }
  return 'en';
}

export const LOCALE_STORAGE_KEY = 'vesper-locale';
export const LOCALE_COOKIE_KEY = 'vesper_locale';
