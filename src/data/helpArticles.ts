export type HelpSectionId =
  | 'getting-started'
  | 'uploading'
  | 'studio'
  | 'exporting'
  | 'plans-billing'
  | 'troubleshooting';

export type HelpArticle = {
  slug: string;
  section: HelpSectionId;
  title: string;
  lastUpdated: string;
  paragraphs: string[];
  relatedSlugs: string[];
};

export const HELP_SECTIONS: { id: HelpSectionId; label: string }[] = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'uploading', label: 'Uploading' },
  { id: 'studio', label: 'The Studio' },
  { id: 'exporting', label: 'Exporting & Sharing' },
  { id: 'plans-billing', label: 'Plans & Billing' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: 'what-is-vesper',
    section: 'getting-started',
    title: 'What is Vesper?',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'Vesper is a sermon-to-reel platform built for churches. Upload a sermon video or paste a YouTube link, and Vesper uses AI to find your most shareable moments — complete with captions, hooks, and timestamps.',
      'The Studio lets you style clips with caption templates, filters, and a live phone preview before exporting a finished MP4 for Instagram Reels, TikTok, and YouTube Shorts.',
      'Vesper is designed for media teams and pastors who want consistent short-form content without spending hours in a traditional editor.',
    ],
    relatedSlugs: ['creating-your-first-clip', 'understanding-the-studio', 'what-counts-as-a-clip'],
  },
  {
    slug: 'creating-your-first-clip',
    section: 'getting-started',
    title: 'Creating your first clip',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'Sign in and go to the homepage upload zone or open the Studio from your dashboard.',
      'Upload an MP4/MOV file (up to 500MB direct upload) or paste a YouTube sermon URL. Vesper queues your video for AI analysis — you will see live progress while it processes.',
      'When analysis completes, you are taken to the results page with clip suggestions. Pick a moment, open Vesper Studio, customize captions, and export your first reel.',
      'Tip: Start with a 10–20 minute segment or a shorter sermon for the fastest first-run experience.',
    ],
    relatedSlugs: ['what-is-vesper', 'supported-file-formats', 'caption-templates'],
  },
  {
    slug: 'understanding-the-studio',
    section: 'getting-started',
    title: 'Understanding the Studio',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'Vesper Studio is where you preview, style, and export clips. It opens from the results page or dashboard library when you select a clip.',
      'The phone preview shows your reel in 9:16 format with captions overlaid in real time. Use the caption editor to change text, template, font, and animation.',
      'The export panel lets you choose format, quality, filters, and download or share the rendered MP4. Free plans can explore the Studio; exporting requires Creator or Church Pro.',
    ],
    relatedSlugs: ['caption-templates', 'export-formats', 'social-kit'],
  },
  {
    slug: 'connecting-social-accounts',
    section: 'getting-started',
    title: 'Connecting your social accounts',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'Open Account Settings from the dashboard and find the Social accounts section.',
      'YouTube Shorts connects via Google OAuth — click Connect and authorize Vesper. Instagram and TikTok direct publishing may require additional API setup; use Download MP4 as a reliable fallback.',
      'Connected accounts appear in the export flow when posting or scheduling is available for your plan.',
    ],
    relatedSlugs: ['posting-to-social', 'instagram-connection', 'downloading-your-reel'],
  },
  {
    slug: 'supported-file-formats',
    section: 'uploading',
    title: 'Supported file formats',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'Vesper accepts common video formats: MP4, MOV, M4V, and WebM. Audio-only uploads (MP3, M4A, WAV) are also supported for sermon analysis.',
      'For best results, upload H.264 MP4 with AAC audio. iPhone recordings (MOV) work well — Vesper normalizes content type on upload.',
      'If your file is rejected, check that it is a valid media file and not corrupted. Re-export from your editor as MP4 if needed.',
    ],
    relatedSlugs: ['file-size-limits', 'creating-your-first-clip', 'stuck-processing'],
  },
  {
    slug: 'file-size-limits',
    section: 'uploading',
    title: 'File size limits and segmented upload',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'Direct browser uploads are limited to 500MB per file. Files upload straight to secure cloud storage (Cloudflare R2) using a presigned URL.',
      'On desktop, files larger than 500MB open the built-in trimmer so you can split the sermon into a segment under the limit before upload.',
      'For very long sermons, consider uploading a trimmed highlight section or using a YouTube link instead of the full master file.',
    ],
    relatedSlugs: ['supported-file-formats', 'using-youtube-link', 'trimming-your-clip'],
  },
  {
    slug: 'using-youtube-link',
    section: 'uploading',
    title: 'Using a YouTube link',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'Paste a public YouTube sermon URL on the homepage. Vesper validates the link, then queues AI analysis on the video.',
      'YouTube links are ideal for long sermons or when you do not have the original file handy. Analysis uses the same AI pipeline as direct uploads.',
      'Processing runs in the background — stay on the progress screen or check your dashboard library when the job completes.',
    ],
    relatedSlugs: ['youtube-export-limitation', 'stuck-processing', 'creating-your-first-clip'],
  },
  {
    slug: 'youtube-export-limitation',
    section: 'uploading',
    title: 'Why YouTube links cannot export rendered reels',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'When you analyze a YouTube link, Vesper references the YouTube stream for preview and clip selection — not a file you own in Vesper storage.',
      'Cloud rendering (Shotstack) requires a direct, accessible source URL to your media in Vesper storage. YouTube URLs are subject to platform restrictions and are not reliable render inputs.',
      'To export a rendered reel from a YouTube sermon, download the source video (with proper rights), upload the MP4 to Vesper, then export from Studio.',
    ],
    relatedSlugs: ['using-youtube-link', 'downloading-your-reel', 'export-failed'],
  },
  {
    slug: 'caption-templates',
    section: 'studio',
    title: 'Caption templates — how to use them',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'In Vesper Studio, open the caption editor on any clip. Templates control font, color, placement, and animation style.',
      'Free plans include the Minimal template. Creator and Church Pro unlock premium templates with bold kinetic styles suited for social media.',
      'Edit caption text to match your church voice, then preview on the phone frame before exporting. Changes save to your project automatically.',
    ],
    relatedSlugs: ['understanding-the-studio', 'filters-color-grades', 'what-counts-as-a-clip'],
  },
  {
    slug: 'trimming-your-clip',
    section: 'studio',
    title: 'Trimming your clip',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'AI suggests start and end timestamps for each clip. On the results page, you can refine which segment is used before opening Studio.',
      'The homepage trimmer splits large upload files — drag handles to select the portion to analyze, then confirm upload.',
      'For fine control inside Studio, adjust clip boundaries in the export panel so your hook lands in the first three seconds.',
    ],
    relatedSlugs: ['file-size-limits', 'creating-your-first-clip', 'export-formats'],
  },
  {
    slug: 'filters-color-grades',
    section: 'studio',
    title: 'Filters and color grades',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'Studio export options include cinematic filters such as warm, noir, and glory grades applied during cloud render.',
      'Filters are baked into the final MP4 — preview the selected look in the export panel before generating.',
      'For brand consistency, Church Pro teams can align filter choices with your church visual identity across all exports.',
    ],
    relatedSlugs: ['caption-templates', 'export-formats', 'understanding-the-studio'],
  },
  {
    slug: 'social-kit',
    section: 'studio',
    title: 'The Social Kit',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'The Social Kit bundles assets for a clip: suggested captions, quote cards, carousel slides, and post copy generated from the sermon analysis.',
      'Find Social Kit assets on the results page alongside each clip. Copy text directly or download visual assets for your posts.',
      'Use Social Kit to keep messaging consistent across Reels, Stories, and feed posts without rewriting from scratch.',
    ],
    relatedSlugs: ['thumbnail-studio', 'posting-to-social', 'understanding-the-studio'],
  },
  {
    slug: 'thumbnail-studio',
    section: 'studio',
    title: 'Thumbnail Studio',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'Thumbnail Studio generates scroll-stopping cover images for your reel using your clip title, sermon theme, and brand colors.',
      'Open it from the results page clip actions. Pick a style, customize text, and download a PNG for YouTube Shorts or as a cover frame.',
      'Strong thumbnails improve tap-through rate when you share links or upload to platforms that support custom covers.',
    ],
    relatedSlugs: ['social-kit', 'downloading-your-reel', 'export-formats'],
  },
  {
    slug: 'export-formats',
    section: 'exporting',
    title: 'Export formats (9:16, 1:1, 16:9)',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'Default export is 9:16 vertical — optimized for Instagram Reels, TikTok, and YouTube Shorts.',
      'Creator and Church Pro plans may also export 1:1 square for feed posts and 16:9 landscape for Facebook or website embeds.',
      'Captions and filters are rendered into the video file so platforms display your reel exactly as previewed in Studio.',
    ],
    relatedSlugs: ['downloading-your-reel', 'understanding-the-studio', 'export-failed'],
  },
  {
    slug: 'downloading-your-reel',
    section: 'exporting',
    title: 'Downloading your reel',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'After cloud rendering completes, click Download in Studio or the dashboard library. Vesper serves the MP4 with a proper attachment header so it saves to your device.',
      'Rendered files are stored on Vesper CDN with signed URLs. Links expire after a period — download promptly and keep a local copy for your archive.',
      'If download opens a browser tab instead of saving, use the Download button inside Vesper rather than copying the raw CDN URL.',
    ],
    relatedSlugs: ['export-formats', 'export-failed', 'posting-to-social'],
  },
  {
    slug: 'posting-to-social',
    section: 'exporting',
    title: 'Posting directly to Instagram / TikTok / YouTube',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'After export, use the Share flow to publish to connected platforms where API access is configured.',
      'YouTube Shorts publishing is available when your Google account is connected in Settings. Upload the rendered MP4 with title and description pre-filled.',
      'For Instagram and TikTok, native API publishing varies by platform policy — when direct post is unavailable, download the MP4 and upload from each app.',
    ],
    relatedSlugs: ['connecting-social-accounts', 'scheduled-posting', 'downloading-your-reel'],
  },
  {
    slug: 'scheduled-posting',
    section: 'exporting',
    title: 'Scheduled posting',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'Scheduled posting lets your media team queue reels for future publish times from the export share modal.',
      'Availability depends on your plan and connected platform APIs. YouTube scheduled uploads are supported when OAuth is active.',
      'If scheduling is not shown for your account, download the reel and use your platform native scheduler or a third-party tool.',
    ],
    relatedSlugs: ['posting-to-social', 'connecting-social-accounts', 'upgrade-downgrade'],
  },
  {
    slug: 'what-counts-as-a-clip',
    section: 'plans-billing',
    title: 'What counts as a clip?',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'One clip usage is counted each time you submit a sermon for AI analysis — whether via upload or YouTube link.',
      'Re-exporting or editing an existing analyzed sermon does not consume an additional clip from your monthly quota.',
      'Free: 2 clips/month · Creator: 20 clips/month · Church Pro: unlimited clips for your team.',
    ],
    relatedSlugs: ['quota-reset', 'upgrade-downgrade', 'creating-your-first-clip'],
  },
  {
    slug: 'quota-reset',
    section: 'plans-billing',
    title: 'When does my quota reset?',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'Your clip quota resets on a rolling 30-day cycle from your last reset date, shown on the dashboard quota widget.',
      'When the reset date passes, your usage count returns to zero and you can analyze new sermons up to your plan limit.',
      'Upgrading mid-cycle applies the new limit immediately but does not retroactively refund clips used on the prior tier.',
    ],
    relatedSlugs: ['what-counts-as-a-clip', 'upgrade-downgrade', 'cancellation-refunds'],
  },
  {
    slug: 'upgrade-downgrade',
    section: 'plans-billing',
    title: 'How to upgrade or downgrade',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'Open Dashboard → Billing or the pricing section on the homepage. Choose Creator ($19/mo) or Church Pro ($49/mo) and complete checkout via Stripe.',
      'Upgrades take effect immediately with prorated billing. Downgrades apply at the end of the current billing period through the Stripe customer portal.',
      'Access the billing portal from Account Settings to update payment method, view invoices, or change plans.',
    ],
    relatedSlugs: ['what-counts-as-a-clip', 'cancellation-refunds', 'export-formats'],
  },
  {
    slug: 'cancellation-refunds',
    section: 'plans-billing',
    title: 'Cancellation and refunds',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'Cancel anytime from the Stripe billing portal linked in Account Settings. Cancellation stops renewal; you keep access until the period ends.',
      'Deleting your Vesper account cancels your Stripe subscription immediately and permanently removes your data.',
      'Refunds are handled case-by-case for billing errors or significant outages. Contact support within 14 days of a charge if you believe a refund is warranted.',
    ],
    relatedSlugs: ['upgrade-downgrade', 'quota-reset', 'not-receiving-emails'],
  },
  {
    slug: 'stuck-processing',
    section: 'troubleshooting',
    title: 'My video is stuck processing',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'Long sermons can take several minutes. The progress screen updates every few seconds — wait at least 10 minutes before retrying.',
      'If status shows failed, check your clip quota (plan limit), verify the YouTube link is public, or try a smaller upload segment.',
      'Refresh the dashboard library — completed jobs appear under Your Harvest. If the job failed after three retries, upload again or contact support with your job ID.',
    ],
    relatedSlugs: ['using-youtube-link', 'file-size-limits', 'what-counts-as-a-clip'],
  },
  {
    slug: 'export-failed',
    section: 'troubleshooting',
    title: 'My export failed',
    lastUpdated: '2026-06-13',
    paragraphs: [
      'Export requires Creator or Church Pro and a valid source video in Vesper storage (not YouTube-only references).',
      'Shotstack cloud rendering needs active API credits and a reachable source URL. An admin can verify Shotstack status from the verify endpoint.',
      'Try exporting again with standard quality first. If failure persists, note the error message and contact support — include job ID and clip title.',
    ],
    relatedSlugs: ['youtube-export-limitation', 'downloading-your-reel', 'upgrade-downgrade'],
  },
  {
    slug: 'instagram-connection',
    section: 'troubleshooting',
    title: "I can't connect my Instagram account",
    lastUpdated: '2026-06-13',
    paragraphs: [
      'Instagram direct publishing requires Meta Business API credentials configured for your Vesper deployment.',
      'If Connect returns an error, use Download MP4 and upload manually through the Instagram app — this is the most reliable workflow for most churches.',
      'Ensure you are using a Business or Creator Instagram account linked to a Facebook Page when API publishing is enabled.',
    ],
    relatedSlugs: ['connecting-social-accounts', 'posting-to-social', 'downloading-your-reel'],
  },
  {
    slug: 'not-receiving-emails',
    section: 'troubleshooting',
    title: "I'm not receiving emails",
    lastUpdated: '2026-06-13',
    paragraphs: [
      'Vesper sends transactional email (welcome, clip ready, quota warnings) via Resend from hello@vesper.biblefunland.com.',
      'Check spam and promotions folders. Add our sender to your contacts and allowlist your church email filter.',
      'If you unsubscribed via an email link, transactional alerts may be suppressed — contact support to re-enable. Verify the email on your Clerk account matches where you expect mail.',
    ],
    relatedSlugs: ['cancellation-refunds', 'creating-your-first-clip', 'stuck-processing'],
  },
];

export function getArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}

export function getArticlesBySection(section: HelpSectionId): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.section === section);
}

export function getRelatedArticles(slug: string): HelpArticle[] {
  const article = getArticleBySlug(slug);
  if (!article) return [];
  return article.relatedSlugs.map((s) => getArticleBySlug(s)).filter((a): a is HelpArticle => Boolean(a));
}

export function searchHelpArticles(query: string): HelpArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return HELP_ARTICLES;
  return HELP_ARTICLES.filter((a) => {
    const sectionLabel = HELP_SECTIONS.find((s) => s.id === a.section)?.label || '';
    const haystack = [a.title, sectionLabel, ...a.paragraphs].join(' ').toLowerCase();
    return haystack.includes(q);
  });
}

export function getSectionLabel(section: HelpSectionId): string {
  return HELP_SECTIONS.find((s) => s.id === section)?.label || section;
}
