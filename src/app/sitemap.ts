import type { MetadataRoute } from 'next';
import { HELP_ARTICLES } from '@/data/helpArticles';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vesper.biblefunland.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const pages = [
    '',
    '/how-it-works',
    '/for-churches',
    '/help',
    '/blog',
    '/blog/sermon-to-reel',
    '/blog/best-times-instagram',
    '/blog/short-form-outreach',
    '/privacy',
    '/terms',
    '/changelog',
  ];

  const helpArticles = HELP_ARTICLES.map((a) => ({
    url: `${baseUrl}/help/${a.slug}`,
    lastModified: new Date(a.lastUpdated),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    ...pages.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified,
      changeFrequency: path.startsWith('/blog') ? ('monthly' as const) : ('weekly' as const),
      priority: path === '' ? 1 : path.startsWith('/blog') ? 0.6 : 0.8,
    })),
    ...helpArticles,
  ];
}
