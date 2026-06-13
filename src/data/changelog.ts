export type ChangelogEntry = {
  date: string;
  version?: string;
  title: string;
  bullets: string[];
};

/** Newest first — update when shipping significant features. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-06-13',
    version: 'v1.4.0',
    title: 'Production infrastructure & compliance',
    bullets: [
      'Async job queue for sermon processing',
      'Sentry error tracking and health checks',
      'Account delete/export, cookie consent, and legal pages',
    ],
  },
  {
    date: '2026-06-01',
    version: 'v1.3.0',
    title: 'Studio export improvements',
    bullets: [
      'MP4 download proxy for reliable exports',
      'Shotstack error handling and admin verify tools',
      'Dashboard clip library with bulk actions',
    ],
  },
  {
    date: '2026-05-15',
    version: 'v1.2.0',
    title: 'Teams & billing',
    bullets: [
      'Church Pro team seats and invite flow',
      'Stripe billing portal integration',
      'Monthly usage quota display',
    ],
  },
];

export function getLatestChangelogDate(): string {
  return CHANGELOG[0]?.date ?? '';
}
