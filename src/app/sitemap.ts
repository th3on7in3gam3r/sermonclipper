import type { MetadataRoute } from 'next';
import { HELP_ARTICLES } from '@/data/helpArticles';
import { COMPARE_PAGES } from '@/data/comparePages';
import { CHURCH_SEGMENT_SLUGS } from '@/data/churchSegments';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vesper.biblefunland.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticPages = [
    '',
    '/how-it-works',
    '/for-churches',
    '/showcase',
    '/partners',
    '/partners/directory',
    '/creators/templates',
    '/help',
    '/blog',
    '/blog/sermon-to-reel',
    '/blog/best-times-instagram',
    '/blog/short-form-outreach',
    '/privacy',
    '/terms',
    '/changelog',
    '/developers',
    '/feedback',
  ];

  const segmentPages = CHURCH_SEGMENT_SLUGS.map((slug) => `/for/${slug}`);
  const comparePages = COMPARE_PAGES.map((p) => `/compare/${p.slug}`);

  const helpArticles = HELP_ARTICLES.map((a) => ({
    url: `${baseUrl}/help/${a.slug}`,
    lastModified: new Date(a.lastUpdated),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const allPaths = [...staticPages, ...segmentPages, ...comparePages];

  return [
    ...allPaths.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified,
      changeFrequency: path.startsWith('/blog') || path.startsWith('/compare') ? ('monthly' as const) : ('weekly' as const),
      priority: path === '' ? 1 : path.startsWith('/blog') || path.startsWith('/help') ? 0.6 : 0.8,
    })),
    ...helpArticles,
  ];
}
