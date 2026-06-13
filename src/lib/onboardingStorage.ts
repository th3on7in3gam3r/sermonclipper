const LEGACY_ONBOARDING_KEY = 'vesper-onboarding-v2-acknowledged';

export function onboardingStorageKey(userId: string) {
  return `vesper-onboarding-complete-${userId}`;
}

export function isOnboardingCompleteLocally(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  return (
    localStorage.getItem(onboardingStorageKey(userId)) === '1' ||
    localStorage.getItem(LEGACY_ONBOARDING_KEY) === '1'
  );
}

export function markOnboardingCompleteLocally(userId: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(onboardingStorageKey(userId), '1');
  localStorage.removeItem(LEGACY_ONBOARDING_KEY);
}
