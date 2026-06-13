import { SITE_URL } from '@/lib/siteConfig';

type EmailContext = {
  plan: string;
  clipCount: number;
  name: string;
  email: string;
  unsubscribeToken?: string;
  lastActiveAt?: Date;
  usageCount?: number;
  cancelFeedback?: { at?: Date };
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

async function sendRaw(to: string, subject: string, html: string, tags?: { name: string; value: string }[]) {
  const { Resend } = await import('resend');
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, skipped: true };
  const resend = new Resend(key);
  const from = process.env.RESEND_FROM_EMAIL || 'Vesper Studio <hello@vesper.biblefunland.com>';
  await resend.emails.send({
    from,
    to,
    subject,
    html,
    tags: tags?.map((t) => ({ name: t.name, value: t.value })),
  });
  return { ok: true };
}

export type ReEngagementSegment =
  | 'never_created_clip'
  | 'inactive_30d'
  | 'quota_reset'
  | 'churned_winback';

const SEGMENTS: Record<
  ReEngagementSegment,
  {
    tag: string;
    subject: (name: string) => string;
    body: (name: string) => string;
    shouldSend: (ctx: EmailContext) => boolean;
  }
> = {
  never_created_clip: {
    tag: 'reengage_never_clip',
    subject: (name) => `Your sermons are waiting, ${name}`,
    body: (name) =>
      `<h1 style="margin:0 0 12px;font-size:22px;">Hi ${name},</h1>
       <p style="color:#D4D4D8;line-height:1.6;">You signed up for Vesper but haven't created your first clip yet. It takes 2 minutes.</p>
       ${cta(`${SITE_URL}/dashboard`, 'Create My First Clip →')}`,
    shouldSend: (ctx) => ctx.clipCount === 0,
  },
  inactive_30d: {
    tag: 'reengage_inactive_30d',
    subject: () => "It's been a while — here's what's new in Vesper",
    body: (name) =>
      `<h1 style="margin:0 0 12px;font-size:22px;">Welcome back, ${name}</h1>
       <p style="color:#D4D4D8;line-height:1.6;">We've shipped Quote Cards, audio sermon support, and PWA install — come try them in the Studio.</p>
       ${cta(`${SITE_URL}/dashboard`, 'Come back and try Quote Cards →')}`,
    shouldSend: (ctx) => {
      if (!ctx.lastActiveAt) return false;
      const days = (Date.now() - ctx.lastActiveAt.getTime()) / 86400000;
      return days >= 30 && ctx.clipCount > 0;
    },
  },
  quota_reset: {
    tag: 'reengage_quota_reset',
    subject: () => 'Your clips reset today — you have 2 new clips to use',
    body: (name) =>
      `<h1 style="margin:0 0 12px;font-size:22px;">Fresh start, ${name}</h1>
       <p style="color:#D4D4D8;line-height:1.6;">Your monthly clip quota reset today. The slate is clean — create a clip today.</p>
       ${cta(`${SITE_URL}/`, 'Create a clip today →')}`,
    shouldSend: (ctx) => ctx.plan === 'free',
  },
  churned_winback: {
    tag: 'reengage_churned_30d',
    subject: () => "We've been busy since you left",
    body: (name) =>
      `<h1 style="margin:0 0 12px;font-size:22px;">We miss you, ${name}</h1>
       <p style="color:#D4D4D8;line-height:1.6;">We've shipped 3 new features since you left — Quote Cards, audio uploads, and embed widgets.</p>
       <p style="color:#D4D4D8;line-height:1.6;margin-top:12px;">Come back — first month at 50% off with code <strong>WELCOME50</strong>.</p>
       ${cta(`${SITE_URL}/dashboard/billing`, 'Reactivate →')}`,
    shouldSend: (ctx) => Boolean(ctx.cancelFeedback?.at),
  },
};

export async function sendReEngagementEmail(
  email: string,
  segment: ReEngagementSegment,
  ctx: Omit<EmailContext, 'email'>
) {
  const tpl = SEGMENTS[segment];
  if (!tpl.shouldSend({ ...ctx, email })) return { ok: false, skipped: true };

  return sendRaw(email, tpl.subject(ctx.name), shell(tpl.body(ctx.name), ctx.unsubscribeToken), [
    { name: 'segment', value: tpl.tag },
  ]);
}

export { SEGMENTS };
