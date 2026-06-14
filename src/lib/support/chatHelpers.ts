import { searchHelpArticles } from '@/data/helpArticles';

export function isSupportOnline(now = new Date()) {
  const hour = now.getUTCHours();
  // Mon–Fri, 14:00–22:00 UTC (~9am–5pm US Eastern)
  const day = now.getUTCDay();
  const weekday = day >= 1 && day <= 5;
  return weekday && hour >= 14 && hour < 22;
}

export function supportResponseExpectation(plan?: string | null) {
  if (plan === 'church_pro' || plan === 'network') return '4 hours';
  if (plan === 'creator') return '8 hours';
  return '24 hours';
}

export function isPrioritySupportPlan(plan?: string | null) {
  return plan === 'church_pro' || plan === 'network';
}

export function matchHelpArticles(query: string) {
  return searchHelpArticles(query).slice(0, 3);
}

export function detectClientContext() {
  if (typeof navigator === 'undefined') {
    return { browser: 'unknown', os: 'unknown' };
  }
  return {
    browser: navigator.userAgent,
    os: navigator.platform || 'unknown',
  };
}

export function buildBugReportTemplate(context?: { browser?: string; os?: string }) {
  const browser = context?.browser || 'unknown';
  const os = context?.os || 'unknown';
  return `What were you trying to do?

What happened instead?

Browser/OS (auto-detected):
${browser}
${os}`;
}
