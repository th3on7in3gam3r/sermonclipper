import { Resend } from 'resend';
import { SITE_URL, SITE_TITLE, SUPPORT_EMAIL } from '@/lib/siteConfig';
import {
  getBrandedFromEmail,
  getBrandedReplyTo,
  getBrandedSiteTitle,
  type WhiteLabelConfig,
} from '@/lib/whiteLabel';

const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'Vesper Studio <hello@vesper.biblefunland.com>';
const UNSUBSCRIBE_BASE = `${SITE_URL}/api/email/unsubscribe`;

let resendClient: Resend | null = null;

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

function emailShell(body: string, unsubscribeToken?: string, brand?: WhiteLabelConfig | null) {
  const churchName = brand?.churchName || SITE_TITLE;
  const logo = brand?.logoUrl
    ? `<img src="${brand.logoUrl}" alt="" height="40" style="margin-bottom:20px;border-radius:8px;" />`
    : '';
  const accent = brand?.primaryColor || '#8B5CF6';
  const unsub = unsubscribeToken
    ? `<p style="margin-top:32px;font-size:12px;color:#71717A;"><a href="${UNSUBSCRIBE_BASE}?token=${encodeURIComponent(unsubscribeToken)}" style="color:${accent};">Unsubscribe</a> · ${churchName}</p>`
    : '';
  const powered =
    brand?.showPoweredBy !== false && brand?.churchName
      ? `<p style="color:#52525B;font-size:11px;margin-top:8px;">Powered by Vesper</p>`
      : '';

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#050508;font-family:Outfit,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050508;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#14141D;border:1px solid ${accent}44;border-radius:16px;padding:32px;">
        <tr><td style="color:#fff;">${logo}${body}${unsub}</td></tr>
      </table>
      <p style="color:#52525B;font-size:12px;margin-top:16px;">© ${new Date().getFullYear()} ${churchName}</p>${powered}
    </td></tr>
  </table></body></html>`;
}

function cta(href: string, label: string, brand?: WhiteLabelConfig | null) {
  const accent = brand?.primaryColor || '#8B5CF6';
  return `<a href="${href}" style="display:inline-block;margin-top:24px;padding:14px 28px;background:${accent};color:#fff;text-decoration:none;border-radius:10px;font-weight:800;font-size:14px;">${label}</a>`;
}

function sendOpts(brand?: WhiteLabelConfig | null) {
  return {
    from: getBrandedFromEmail(brand),
    replyTo: getBrandedReplyTo(brand),
  };
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  unsubscribeToken?: string,
  brand?: WhiteLabelConfig | null
) {
  const resend = getResend();
  if (!resend) return { ok: false, skipped: true };

  const siteTitle = getBrandedSiteTitle(brand);
  const html = emailShell(
    `<h1 style="margin:0 0 12px;font-size:24px;">Welcome to ${siteTitle.replace(' Studio', '')}, ${name}!</h1>
     <p style="color:#D4D4D8;line-height:1.6;margin:0;">Your account is ready. Upload a sermon or paste a YouTube link and we will find your best moments for social media.</p>
     ${cta(`${SITE_URL}/#upload`, 'Start Your First Clip →', brand)}`,
    unsubscribeToken,
    brand
  );

  await resend.emails.send({
    ...sendOpts(brand),
    to,
    subject: `Welcome to ${siteTitle}`,
    html,
  });
  return { ok: true };
}

export async function sendRenderCompleteEmail(
  to: string,
  params: { clipTitle: string; resultsUrl: string; thumbnailUrl?: string },
  unsubscribeToken?: string,
  brand?: WhiteLabelConfig | null
) {
  const resend = getResend();
  if (!resend) return { ok: false, skipped: true };

  const thumb = params.thumbnailUrl
    ? `<img src="${params.thumbnailUrl}" alt="" width="100%" style="border-radius:12px;margin:16px 0;max-height:200px;object-fit:cover;" />`
    : '';

  const html = emailShell(
    `<h1 style="margin:0 0 12px;font-size:22px;">Your clip is ready</h1>
     <p style="color:#D4D4D8;line-height:1.6;margin:0;"><strong>${params.clipTitle}</strong> finished rendering.</p>
     ${thumb}
     ${cta(params.resultsUrl, 'View Your Clip →', brand)}`,
    unsubscribeToken,
    brand
  );

  await resend.emails.send({
    ...sendOpts(brand),
    to,
    subject: 'Your clip is ready',
    html,
  });
  return { ok: true };
}

export async function sendQuotaWarningEmail(
  to: string,
  params: { used: number; limit: number; resetDate: string },
  unsubscribeToken?: string,
  brand?: WhiteLabelConfig | null
) {
  const resend = getResend();
  if (!resend) return { ok: false, skipped: true };

  const html = emailShell(
    `<h1 style="margin:0 0 12px;font-size:22px;">You are at ${Math.round((params.used / params.limit) * 100)}% of your monthly clips</h1>
     <p style="color:#D4D4D8;line-height:1.6;margin:0;">You have used ${params.used} of ${params.limit} clips this month. Quota resets on ${params.resetDate}.</p>
     ${cta(`${SITE_URL}/#pricing`, 'Upgrade for More Clips →', brand)}`,
    unsubscribeToken,
    brand
  );

  await resend.emails.send({ ...sendOpts(brand), to, subject: 'Quota warning — 80% used', html });
  return { ok: true };
}

export async function sendQuotaReachedEmail(
  to: string,
  params: { resetDate: string },
  unsubscribeToken?: string,
  brand?: WhiteLabelConfig | null
) {
  const resend = getResend();
  if (!resend) return { ok: false, skipped: true };

  const html = emailShell(
    `<h1 style="margin:0 0 12px;font-size:22px;">Monthly clip limit reached</h1>
     <p style="color:#D4D4D8;line-height:1.6;margin:0;">You have used all your clips this month. Upgrade for more, or wait until ${params.resetDate} when your quota refreshes.</p>
     ${cta(`${SITE_URL}/#pricing`, 'Upgrade Now →', brand)}`,
    unsubscribeToken,
    brand
  );

  await resend.emails.send({ ...sendOpts(brand), to, subject: 'Monthly clip limit reached', html });
  return { ok: true };
}

export async function sendMonthlyRecapEmail(
  to: string,
  params: { monthLabel: string; clipCount: number },
  unsubscribeToken?: string,
  brand?: WhiteLabelConfig | null
) {
  const resend = getResend();
  if (!resend) return { ok: false, skipped: true };

  const html = emailShell(
    `<h1 style="margin:0 0 12px;font-size:22px;">Here is what you created in ${params.monthLabel}</h1>
     <p style="color:#D4D4D8;line-height:1.6;margin:0;">You generated <strong>${params.clipCount}</strong> sermon ${params.clipCount === 1 ? 'project' : 'projects'} last month. Keep sharing your message.</p>
     ${cta(`${SITE_URL}/dashboard`, 'Open Your Studio →', brand)}`,
    unsubscribeToken,
    brand
  );

  await resend.emails.send({
    ...sendOpts(brand),
    to,
    subject: `Your recap — ${params.monthLabel}`,
    html,
  });
  return { ok: true };
}

export async function sendTeamInviteEmail(
  to: string,
  params: { inviterName: string; teamName: string; inviteUrl: string; role: string },
  unsubscribeToken?: string,
  brand?: WhiteLabelConfig | null
) {
  const resend = getResend();
  if (!resend) return { ok: false, skipped: true };

  const html = emailShell(
    `<h1 style="margin:0 0 12px;font-size:22px;">Join ${params.teamName}</h1>
     <p style="color:#D4D4D8;line-height:1.6;margin:0;">${params.inviterName} invited you as <strong>${params.role}</strong>.</p>
     ${cta(params.inviteUrl, 'Accept Invite →', brand)}`,
    unsubscribeToken,
    brand
  );

  await resend.emails.send({
    ...sendOpts(brand),
    to,
    subject: `You are invited to ${params.teamName}`,
    html,
  });
  return { ok: true };
}

export async function sendAccountDeletedEmail(to: string, brand?: WhiteLabelConfig | null) {
  const resend = getResend();
  if (!resend) return { ok: false, skipped: true };

  const html = emailShell(
    `<h1 style="margin:0 0 12px;font-size:22px;">Your account has been deleted</h1>
     <p style="color:#D4D4D8;line-height:1.6;margin:0;">We have permanently removed your account, clips, and associated data. If you did not request this, contact us immediately at ${SUPPORT_EMAIL}.</p>`,
    undefined,
    brand
  );

  await resend.emails.send({ ...sendOpts(brand), to, subject: 'Your account has been deleted', html });
  return { ok: true };
}

export async function sendDataExportReadyEmail(
  to: string,
  downloadUrl: string,
  unsubscribeToken?: string,
  brand?: WhiteLabelConfig | null
) {
  const resend = getResend();
  if (!resend) return { ok: false, skipped: true };

  const html = emailShell(
    `<h1 style="margin:0 0 12px;font-size:22px;">Your Vesper data export is ready</h1>
     <p style="color:#D4D4D8;line-height:1.6;margin:0;">Download your ZIP within 48 hours. The link expires automatically for your security.</p>
     ${cta(downloadUrl, 'Download My Data →', brand)}
     <p style="color:#71717A;font-size:13px;margin-top:16px;">Includes account settings, clip metadata, social posts, billing summary, and exported MP4s we have on file.</p>`,
    unsubscribeToken,
    brand
  );

  await resend.emails.send({
    ...sendOpts(brand),
    to,
    subject: 'Your Vesper data export is ready',
    html,
  });
  return { ok: true };
}
