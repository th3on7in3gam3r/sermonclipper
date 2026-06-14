import { SITE_URL } from '@/lib/siteConfig';

type NewsletterEmbedInput = {
  watchUrl: string;
  thumbnailUrl: string;
  title: string;
  durationLabel?: string;
  churchName?: string;
};

export function buildNewsletterEmbedHtml(input: NewsletterEmbedInput): string {
  const { watchUrl, thumbnailUrl, title, durationLabel, churchName } = input;
  const alt = `${title}${churchName ? ` — ${churchName}` : ''}`;

  return `<!-- Vesper Newsletter Embed -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center" style="padding:0;">
      <a href="${watchUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:block;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
          <tr>
            <td style="position:relative;padding:0;line-height:0;">
              <img src="${thumbnailUrl}" alt="${alt}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="background:rgba(0,0,0,0.55);padding:0;margin-top:-48px;">
              <img src="${SITE_URL}/icon-192.png" alt="Play" width="64" height="64" style="display:block;margin:-32px auto 0 auto;border-radius:50%;border:3px solid #fff;background:#7c3aed;" />
            </td>
          </tr>
        </table>
      </a>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 8px 0 8px;">
      <h2 style="margin:0 0 8px 0;font-size:20px;line-height:1.3;color:#18181b;">${title}</h2>
      ${durationLabel ? `<p style="margin:0 0 12px 0;font-size:14px;color:#71717a;">${durationLabel}</p>` : ''}
      <p style="margin:0;font-size:16px;">
        <a href="${watchUrl}" target="_blank" rel="noopener noreferrer" style="color:#7c3aed;font-weight:700;text-decoration:none;">Watch Now →</a>
      </p>
      <p style="margin:12px 0 0 0;font-size:12px;color:#a1a1aa;">Plain text link: ${watchUrl}</p>
    </td>
  </tr>
</table>`;
}

export function buildNewsletterPlainText(input: NewsletterEmbedInput): string {
  return `${input.title}${input.durationLabel ? ` (${input.durationLabel})` : ''}\nWatch: ${input.watchUrl}`;
}

export const NEWSLETTER_PLATFORM_TIPS: Record<string, string> = {
  mailchimp: 'In Mailchimp, add a Code block in your campaign and paste the HTML snippet.',
  beehiiv: 'In Beehiiv, use a Custom HTML block in the post editor and paste the snippet.',
  convertkit: 'In Kit (ConvertKit), add an HTML snippet block to your broadcast and paste the code.',
};
