export type InspirationItem = {
  id: string;
  platform: 'youtube' | 'tiktok';
  title: string;
  thumbnailUrl: string;
  viewCount: number;
  caption: string;
  durationSeconds?: number;
  publishedAt?: string;
  externalUrl: string;
  styleHints?: {
    templateStyle: string;
    textPlacement: string;
    colorPalette: string;
  };
};

const FALLBACK_ITEMS: InspirationItem[] = [
  {
    id: 'sample-yt-1',
    platform: 'youtube',
    title: 'The God Who Meets You in the Valley',
    thumbnailUrl: 'https://i.ytimg.com/vi/ScMzIvxBSi4/hqdefault.jpg',
    viewCount: 128000,
    caption: 'Hope for the hard seasons #SermonClip #ChurchReels',
    durationSeconds: 42,
    externalUrl: 'https://www.youtube.com/shorts/ScMzIvxBSi4',
  },
  {
    id: 'sample-yt-2',
    platform: 'youtube',
    title: 'Grace Changes Everything',
    thumbnailUrl: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg',
    viewCount: 54000,
    caption: 'One line that reframed my week #BibleVerse',
    durationSeconds: 38,
    externalUrl: 'https://www.youtube.com/shorts/aqz-KE-bpKQ',
  },
];

export function analyzeInspirationStyle(item: InspirationItem) {
  const caption = item.caption.toLowerCase();
  const templateStyle = caption.includes('verse') || caption.includes('bible') ? 'Scripture bold' : 'Minimal hook';
  const textPlacement = item.durationSeconds && item.durationSeconds < 45 ? 'Lower third captions' : 'Center kinetic text';
  const colorPalette =
    caption.includes('hope') || caption.includes('grace') ? 'Warm gold + deep navy' : 'High-contrast white on charcoal';
  return { templateStyle, textPlacement, colorPalette };
}

export async function fetchInspirationFeed(filters: {
  minViews?: number;
  maxDuration?: number;
  platform?: string;
}): Promise<InspirationItem[]> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  let items: InspirationItem[] = [];

  if (apiKey) {
    try {
      const q = encodeURIComponent('#SermonClip OR #ChurchReels OR #BibleVerse');
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&maxResults=12&q=${q}&key=${apiKey}`,
        { next: { revalidate: 3600 } }
      );
      const data = await res.json();
      items = (data.items || []).map((item: { id?: { videoId?: string }; snippet?: Record<string, unknown> }) => {
        const thumbs = item.snippet?.thumbnails as Record<string, { url?: string }> | undefined;
        return {
        id: item.id?.videoId || '',
        platform: 'youtube' as const,
        title: (item.snippet?.title as string) || 'Sermon reel',
        thumbnailUrl: thumbs?.high?.url || thumbs?.default?.url || '',
        viewCount: 0,
        caption: String(item.snippet?.description || item.snippet?.title || '').slice(0, 160),
        publishedAt: item.snippet?.publishedAt as string | undefined,
        externalUrl: `https://www.youtube.com/shorts/${item.id?.videoId}`,
      };
      });
    } catch {
      items = FALLBACK_ITEMS;
    }
  } else {
    items = FALLBACK_ITEMS;
  }

  if (filters.minViews) items = items.filter((i) => i.viewCount >= filters.minViews!);
  if (filters.maxDuration) items = items.filter((i) => !i.durationSeconds || i.durationSeconds <= filters.maxDuration!);
  if (filters.platform && filters.platform !== 'all') {
    items = items.filter((i) => i.platform === filters.platform);
  }

  return items.map((item) => ({ ...item, styleHints: analyzeInspirationStyle(item) }));
}
