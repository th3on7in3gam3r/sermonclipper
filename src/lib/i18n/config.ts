'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources, type AppLocale } from './resources';

let initialized = false;

export function initI18n(locale: AppLocale) {
  if (initialized) {
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
    return i18n;
  }

  void i18n.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

  initialized = true;
  return i18n;
}

export default i18n;
