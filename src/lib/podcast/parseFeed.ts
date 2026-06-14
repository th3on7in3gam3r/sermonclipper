/** Server-side RSS parser for podcast feeds. */
export type PodcastEpisode = {
  guid: string;
  title: string;
  publishedAt: string;
  durationSeconds: number | null;
  speaker: string | null;
  audioUrl: string;
};

function parseDuration(itunesDuration?: string | null): number | null {
  if (!itunesDuration) return null;
  const trimmed = itunesDuration.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const parts = trimmed.split(':').map(Number);
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

export async function fetchPodcastEpisodesServer(feedUrl: string, limit = 20) {
  const res = await fetch(feedUrl, {
    headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
  });
  if (!res.ok) throw new Error('Could not fetch podcast feed');
  const xml = await res.text();

  const feedTitleMatch = xml.match(/<channel>[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
  const feedTitle = feedTitleMatch?.[1]?.trim().replace(/<[^>]+>/g, '') || 'Podcast';

  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  const episodes: PodcastEpisode[] = [];

  for (const block of itemBlocks.slice(0, limit)) {
    const audioMatch = block.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
    const audioUrl = audioMatch?.[1];
    if (!audioUrl) continue;

    const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const guidMatch = block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
    const pubMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const authorMatch =
      block.match(/<itunes:author>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/itunes:author>/i) ||
      block.match(/<author>([\s\S]*?)<\/author>/i);
    const durationMatch = block.match(/<itunes:duration>([\s\S]*?)<\/itunes:duration>/i);

    episodes.push({
      guid: guidMatch?.[1]?.trim().replace(/<[^>]+>/g, '') || audioUrl,
      title: titleMatch?.[1]?.trim().replace(/<[^>]+>/g, '') || 'Untitled episode',
      publishedAt: pubMatch?.[1]?.trim() || '',
      durationSeconds: parseDuration(durationMatch?.[1]?.trim() || null),
      speaker: authorMatch?.[1]?.trim().replace(/<[^>]+>/g, '') || null,
      audioUrl,
    });
  }

  return { feedTitle, episodes };
}
