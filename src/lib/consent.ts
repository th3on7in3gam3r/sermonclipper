export type ConsentCategory = 'essential' | 'analytics' | 'marketing';

export type ConsentPreferences = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

const STORAGE_KEY = 'vesper_cookie_consent';

export function getConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentPreferences) : null;
  } catch {
    return null;
  }
}

export function saveConsent(prefs: Omit<ConsentPreferences, 'essential' | 'decidedAt'> & { essential?: true }) {
  const value: ConsentPreferences = {
    essential: true,
    analytics: prefs.analytics,
    marketing: prefs.marketing,
    decidedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('vesper:consent', { detail: value }));
  return value;
}

export function hasAnalyticsConsent(): boolean {
  return getConsent()?.analytics === true;
}

export function acceptAllConsent() {
  return saveConsent({ analytics: true, marketing: true });
}

export function rejectNonEssentialConsent() {
  return saveConsent({ analytics: false, marketing: false });
}
