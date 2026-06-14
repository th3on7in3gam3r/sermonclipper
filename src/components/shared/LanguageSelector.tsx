'use client';

import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { LOCALE_LABELS, SUPPORTED_LOCALES, type AppLocale } from '@/lib/i18n/resources';
import { changeAppLocale } from '@/components/providers/I18nProvider';

type Props = {
  compact?: boolean;
};

export default function LanguageSelector({ compact }: Props) {
  const { i18n, t } = useTranslation();
  const current = (i18n.language?.split('-')[0] as AppLocale) || 'en';

  const onChange = async (locale: AppLocale) => {
    changeAppLocale(locale);
    try {
      await fetch('/api/user/locale', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });
      toast.success(t('settings.saved'));
    } catch {
      /* guest users still get local preference */
    }
  };

  return (
    <label style={{ display: 'block' }}>
      {!compact && (
        <>
          <span style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            {t('settings.languageTitle')}
          </span>
          {!compact && (
            <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '12px', lineHeight: 1.5 }}>
              {t('settings.languageDesc')}
            </p>
          )}
        </>
      )}
      <select
        value={current}
        onChange={(e) => void onChange(e.target.value as AppLocale)}
        aria-label={t('common.language')}
        style={{
          width: compact ? 'auto' : '100%',
          padding: '10px 14px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: '#0a0a0f',
          color: '#fff',
          minWidth: compact ? '140px' : undefined,
        }}
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
