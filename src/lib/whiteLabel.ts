import type { IUser } from '@/models/User';

export const WHITE_LABEL_CNAME_TARGET =
  process.env.WHITE_LABEL_CNAME_TARGET || 'app.vesper.studio';

export type WhiteLabelConfig = NonNullable<IUser['whiteLabel']>;

export function getDefaultWhiteLabel(): WhiteLabelConfig {
  return {
    showPoweredBy: true,
  };
}

export function normalizeHost(host: string): string {
  return host.split(':')[0].toLowerCase().replace(/\.$/, '');
}

export function isPrimaryAppHost(host: string): boolean {
  const normalized = normalizeHost(host);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vesper.biblefunland.com';
  try {
    const primary = normalizeHost(new URL(appUrl).hostname);
    return normalized === primary || normalized === 'localhost' || normalized.endsWith('.vercel.app');
  } catch {
    return true;
  }
}

export function getBrandedSiteTitle(whiteLabel?: WhiteLabelConfig | null): string {
  if (whiteLabel?.churchName) return `${whiteLabel.churchName} Studio`;
  return 'Vesper Studio';
}

export function getBrandedFromEmail(whiteLabel?: WhiteLabelConfig | null): string {
  if (whiteLabel?.emailDomainVerified && whiteLabel.emailDomain) {
    const name = whiteLabel.churchName || 'Studio';
    return `${name} <studio@${whiteLabel.emailDomain}>`;
  }
  return process.env.RESEND_FROM_EMAIL || 'Vesper Studio <hello@vesper.biblefunland.com>';
}

export function getBrandedReplyTo(whiteLabel?: WhiteLabelConfig | null): string | undefined {
  if (whiteLabel?.emailReplyTo) return whiteLabel.emailReplyTo;
  if (whiteLabel?.emailDomainVerified && whiteLabel.emailDomain) {
    return `support@${whiteLabel.emailDomain}`;
  }
  return undefined;
}
