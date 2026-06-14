import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';
import WatchPlayer from '@/components/watch/WatchPlayer';

type Props = { params: Promise<{ clipId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clipId } = await params;
  try {
    const res = await fetch(`${SITE_URL}/api/watch/${encodeURIComponent(clipId)}`, { next: { revalidate: 300 } });
    const data = await res.json();
    const title = data.title || 'Sermon clip';
    return {
      title: `${title} | Watch`,
      description: data.sermonTitle || 'Watch this sermon highlight on Vesper.',
      openGraph: {
        title,
        description: data.sermonTitle,
        type: 'video.other',
        images: data.thumbnailUrl ? [{ url: data.thumbnailUrl }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        images: data.thumbnailUrl ? [data.thumbnailUrl] : undefined,
      },
    };
  } catch {
    return { title: 'Watch | Vesper' };
  }
}

export default async function WatchPage({ params }: Props) {
  const { clipId } = await params;
  return <WatchPlayer clipId={clipId} />;
}
