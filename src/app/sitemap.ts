import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vesper.biblefunland.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const pages = [
    '',
    '/how-it-works',
    '/for-churches',
    '/blog',
    '/blog/sermon-to-reel',
    '/blog/best-times-instagram',
    '/blog/short-form-outreach',
    '/privacy',
    '/terms',
    '/changelog',
  ];

  return pages.map((path, i) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: path.startsWith('/blog') ? ('monthly' as const) : ('weekly' as const),
    priority: path === '' ? 1 : path.startsWith('/blog') ? 0.6 : 0.8,
  }));
}
