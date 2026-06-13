import { Resend } from 'resend';
import { SITE_URL, SITE_TITLE } from '@/lib/siteConfig';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Vesper Studio <hello@vesper.biblefunland.com>';
const UNSUBSCRIBE_BASE = `${SITE_URL}/api/email/unsubscribe`;

let resendClient: Resend | null = null;

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

function emailShell(body: string, unsubscribeToken?: string) {
  const unsub = unsubscribeToken
    ? `<p style="margin-top:32px;font-size:12px;color:#71717A;"><a href="${UNSUBSCRIBE_BASE}?token=${encodeURIComponent(unsubscribeToken)}" style="color:#A78BFA;">Unsubscribe</a> from Vesper emails.</p>`
    : '';

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#050508;font-family:Outfit,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050508;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#14141D;border:1px solid rgba(139,92,246,0.25);border-radius:16px;padding:32px;">
        <tr><td style="color:#fff;">${body}${unsub}</td></tr>
      </table>
      <p style="color:#52525B;font-size:12px;margin-top:16px;">© ${new Date().getFullYear()} ${SITE_TITLE}</p>
    </td></tr>
  </table></body></html>`;
}

function cta(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#8B5CF6;color:#fff;text-decoration:none;border-radius:10px;font-weight:800;font-size:14px;">${label}</a>`;
}

export async function sendWelcomeEmail(to: string, name: string, unsubscribeToken?: string) {
  const resend = getResend();
  if (!resend) return { ok: false, skipped: true };

  const html = emailShell(
    `<h1 style="margin:0 0 12px;font-size:24px;">Welcome to Vesper, ${name}!</h1>
     <p style="color:#D4D4D8;line-height:1.6;margin:0;">Your account is ready. Upload a sermon or paste a YouTube link and Vesper will find your best moments for social media.</p>
     ${cta(`${SITE_URL}/#upload`, 'Start Your First Clip →')}`,
    unsubscribeToken
  );

  await resend.emails.send({ from: FROM_EMAIL, to, subject: 'Welcome to Vesper Studio', html });
  return { ok: true };
}

export async function sendRenderCompleteEmail(
  to: string,
  params: { clipTitle: string; resultsUrl: string; thumbnailUrl?: string },
  unsubscribeToken?: string
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
     ${cta(params.resultsUrl, 'View Your Clip →')}`,
    unsubscribeToken
  );

  await resend.emails.send({ from: FROM_EMAIL, to, subject: 'Your Vesper clip is ready', html });
  return { ok: true };
}

export async function sendQuotaWarningEmail(
  to: string,
  params: { used: number; limit: number; resetDate: string },
  unsubscribeToken?: string
) {
  const resend = getResend();
  if (!resend) return { ok: false, skipped: true };

  const html = emailShell(
    `<h1 style="margin:0 0 12px;font-size:22px;">You are at ${Math.round((params.used / params.limit) * 100)}% of your monthly clips</h1>
     <p style="color:#D4D4D8;line-height:1.6;margin:0;">You have used ${params.used} of ${params.limit} clips this month. Quota resets on ${params.resetDate}.</p>
     ${cta(`${SITE_URL}/#pricing`, 'Upgrade for More Clips →')}`,
    unsubscribeToken
  );

  await resend.emails.send({ from: FROM_EMAIL, to, subject: 'Vesper quota warning — 80% used', html });
  return { ok: true };
}

export async function sendQuotaReachedEmail(
  to: string,
  params: { resetDate: string },
  unsubscribeToken?: string
) {
  const resend = getResend();
  if (!resend) return { ok: false, skipped: true };

  const html = emailShell(
    `<h1 style="margin:0 0 12px;font-size:22px;">Monthly clip limit reached</h1>
     <p style="color:#D4D4D8;line-height:1.6;margin:0;">You have used all your clips this month. Upgrade for more, or wait until ${params.resetDate} when your quota refreshes.</p>
     ${cta(`${SITE_URL}/#pricing`, 'Upgrade Now →')}`,
    unsubscribeToken
  );

  await resend.emails.send({ from: FROM_EMAIL, to, subject: 'Vesper — monthly clip limit reached', html });
  return { ok: true };
}

export async function sendMonthlyRecapEmail(
  to: string,
  params: { monthLabel: string; clipCount: number },
  unsubscribeToken?: string
) {
  const resend = getResend();
  if (!resend) return { ok: false, skipped: true };

  const html = emailShell(
    `<h1 style="margin:0 0 12px;font-size:22px;">Here is what you created in ${params.monthLabel}</h1>
     <p style="color:#D4D4D8;line-height:1.6;margin:0;">You generated <strong>${params.clipCount}</strong> sermon ${params.clipCount === 1 ? 'project' : 'projects'} with Vesper last month. Keep sharing your message.</p>
     ${cta(`${SITE_URL}/dashboard`, 'Open Your Studio →')}`,
    unsubscribeToken
  );

  await resend.emails.send({ from: FROM_EMAIL, to, subject: `Your Vesper recap — ${params.monthLabel}`, html });
  return { ok: true };
}

export async function sendTeamInviteEmail(
  to: string,
  params: { inviterName: string; teamName: string; inviteUrl: string; role: string },
  unsubscribeToken?: string
) {
  const resend = getResend();
  if (!resend) return { ok: false, skipped: true };

  const html = emailShell(
    `<h1 style="margin:0 0 12px;font-size:22px;">Join ${params.teamName} on Vesper</h1>
     <p style="color:#D4D4D8;line-height:1.6;margin:0;">${params.inviterName} invited you as <strong>${params.role}</strong>.</p>
     ${cta(params.inviteUrl, 'Accept Invite →')}`,
    unsubscribeToken
  );

  await resend.emails.send({ from: FROM_EMAIL, to, subject: `You are invited to ${params.teamName} on Vesper`, html });
  return { ok: true };
}
