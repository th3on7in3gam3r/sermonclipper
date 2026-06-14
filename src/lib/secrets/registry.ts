/** Secret rotation metadata — values live in env/secrets manager; this tracks schedules only. */

export type SecretMeta = {
  id: string;
  label: string;
  rotationDays: number;
  lastRotatedEnv?: string;
  previousEnv?: string;
  overdue: boolean;
  daysUntilRotation: number | null;
};

function parseDate(raw?: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysSince(date: Date | null) {
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

function buildMeta(
  id: string,
  label: string,
  rotationDays: number,
  lastRotatedEnv?: string,
  previousEnv?: string
): SecretMeta {
  const last = parseDate(process.env[lastRotatedEnv || '']);
  const age = daysSince(last);
  const daysUntilRotation = age === null ? null : Math.max(0, rotationDays - age);
  const overdue = age !== null && age > rotationDays;

  return {
    id,
    label,
    rotationDays,
    lastRotatedEnv,
    previousEnv,
    overdue,
    daysUntilRotation,
  };
}

export function getSecretsHealthReport() {
  return [
    buildMeta('stripe_api', 'Stripe API key', 90, 'STRIPE_KEY_LAST_ROTATED'),
    buildMeta('stripe_webhook', 'Stripe webhook signing secret', 180, 'STRIPE_WEBHOOK_LAST_ROTATED', 'STRIPE_WEBHOOK_SECRET_PREVIOUS'),
    buildMeta('openai', 'OpenAI API key', 90, 'OPENAI_KEY_LAST_ROTATED'),
    buildMeta('cron_secret', 'Cron / worker secret', 180, 'CRON_SECRET_LAST_ROTATED', 'CRON_SECRET_PREVIOUS'),
    buildMeta('clerk', 'Clerk session (managed by Clerk)', 180),
    buildMeta('mongodb', 'MongoDB connection string', 90, 'MONGODB_URI_LAST_ROTATED'),
    buildMeta('resend', 'Resend email API key', 90, 'RESEND_KEY_LAST_ROTATED'),
  ];
}

export function getConfiguredSecretIds(): string[] {
  const map: Record<string, string | undefined> = {
    stripe_api: process.env.STRIPE_SECRET_KEY,
    stripe_webhook: process.env.STRIPE_WEBHOOK_SECRET,
    openai: process.env.OPENAI_API_KEY,
    cron_secret: process.env.CRON_SECRET,
    mongodb: process.env.MONGODB_URI,
    resend: process.env.RESEND_API_KEY,
  };
  return Object.entries(map)
    .filter(([, v]) => Boolean(v))
    .map(([k]) => k);
}
