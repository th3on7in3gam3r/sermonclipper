import { SITE_URL } from '@/lib/siteConfig';

type EmailContext = {
  plan: string;
  clipCount: number;
  name: string;
  email: string;
  unsubscribeToken?: string;
};

function shell(body: string, unsubscribeToken?: string) {
  const unsub = unsubscribeToken
    ? `<p style="margin-top:32px;font-size:12px;color:#71717A;"><a href="${SITE_URL}/api/email/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}" style="color:#A78BFA;">Unsubscribe</a></p>`
    : '';
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#050508;font-family:Outfit,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050508;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#14141D;border:1px solid rgba(139,92,246,0.25);border-radius:16px;padding:32px;">
        <tr><td style="color:#fff;">${body}${unsub}</td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

function cta(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#8B5CF6;color:#fff;text-decoration:none;border-radius:10px;font-weight:800;">${label}</a>`;
}

async function sendRaw(to: string, subject: string, html: string) {
  const { Resend } = await import('resend');
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, skipped: true };
  const resend = new Resend(key);
  const from = process.env.RESEND_FROM_EMAIL || 'Vesper Studio <hello@vesper.biblefunland.com>';
  await resend.emails.send({ from, to, subject, html });
  return { ok: true };
}

const TEMPLATES: Record<
  number,
  {
    subject: (name: string) => string;
    body: (name: string) => string;
    skipIf?: (ctx: EmailContext) => boolean;
  }
> = {
  0: {
    subject: (name) => `Welcome to Vesper, ${name} 🎬`,
    body: (name) =>
      `<h1 style="margin:0 0 12px;font-size:24px;">Welcome to Vesper, ${name}!</h1>
       <p style="color:#D4D4D8;line-height:1.6;">Vesper turns your sermons into cinematic reels for every platform.</p>
       <p style="color:#D4D4D8;line-height:1.6;margin-top:12px;"><strong>Tip:</strong> Start by uploading a 10-minute clip.</p>
       ${cta(`${SITE_URL}/dashboard`, 'Open the Studio →')}`,
  },
  1: {
    subject: () => '3 things that make a great Vesper clip',
    body: (name) =>
      `<h1 style="margin:0 0 12px;font-size:22px;">Hi ${name},</h1>
       <ol style="color:#D4D4D8;line-height:1.8;padding-left:20px;">
         <li>Choose a moment with clear emotional impact</li>
         <li>Ensure good audio</li>
         <li>Try a 10–20 minute segment first</li>
       </ol>
       ${cta(`${SITE_URL}/#upload`, 'Upload a Sermon →')}`,
  },
  3: {
    subject: () => 'Your first reel is 2 minutes away',
    skipIf: (ctx) => ctx.clipCount > 0,
    body: (name) =>
      `<h1 style="margin:0 0 12px;font-size:22px;">Hi ${name},</h1>
       <p style="color:#D4D4D8;line-height:1.6;">We noticed you haven't created a clip yet. Upload a sermon or paste a YouTube link.</p>
       ${cta(`${SITE_URL}/dashboard`, 'Open Studio →')}`,
  },
  5: {
    subject: () => 'Did you know Vesper generates captions automatically?',
    body: (name) =>
      `<h1 style="margin:0 0 12px;font-size:22px;">Caption magic, ${name}</h1>
       <p style="color:#D4D4D8;line-height:1.6;">Customize fonts, colors, and placement in the Studio caption editor.</p>
       ${cta(`${SITE_URL}/dashboard`, 'Try the Caption Editor →')}`,
  },
  7: {
    subject: () => 'How Grace Community Church saves 8 hours a week',
    body: () =>
      `<h1 style="margin:0 0 12px;font-size:22px;">Real results from real churches</h1>
       <p style="color:#D4D4D8;line-height:1.6;">"What used to take 10 hours now takes 10 minutes." Share Vesper with your media team.</p>
       ${cta(`${SITE_URL}/dashboard`, 'Open Studio →')}`,
  },
  10: {
    subject: () => "You're almost out of clips for this month",
    skipIf: (ctx) => ctx.plan !== 'free',
    body: (name) =>
      `<h1 style="margin:0 0 12px;font-size:22px;">Upgrade to Creator, ${name}</h1>
       <p style="color:#D4D4D8;line-height:1.6;">20 clips/month for $19/mo with priority processing.</p>
       ${cta(`${SITE_URL}/#pricing`, 'Upgrade for $19/mo →')}`,
  },
  14: {
    subject: () => 'Know another church that could use this?',
    body: (name) =>
      `<h1 style="margin:0 0 12px;font-size:22px;">Refer a church, ${name}</h1>
       <p style="color:#D4D4D8;line-height:1.6;">Earn a free month for every church you refer.</p>
       ${cta(`${SITE_URL}/dashboard/settings`, 'Get Your Referral Link →')}`,
  },
};

export async function sendOnboardingEmail(email: string, day: number, ctx: Omit<EmailContext, 'email'>) {
  const tpl = TEMPLATES[day];
  if (!tpl) return { ok: false, skipped: true };
  if (tpl.skipIf?.({ ...ctx, email })) return { ok: false, skipped: true };
  return sendRaw(email, tpl.subject(ctx.name), shell(tpl.body(ctx.name), ctx.unsubscribeToken));
}

export function getDueOnboardingDays(createdAt: Date, sentDays: number[]): number[] {
  const ageDays = Math.floor((Date.now() - createdAt.getTime()) / 86400000);
  const schedule = [0, 1, 3, 5, 7, 10, 14];
  return schedule.filter((day) => ageDays >= day && !sentDays.includes(day));
}

export const ONBOARDING_SCHEDULE_DAYS = [0, 1, 3, 5, 7, 10, 14];
