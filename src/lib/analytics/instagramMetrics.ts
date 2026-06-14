import type { YouTubeMetricRow } from '@/lib/analytics/youtubeMetrics';

/** Instagram Graph API metrics — requires connected business account. */
export async function fetchInstagramReelMetrics(
  _accessToken: string | undefined,
  _mediaId: string
): Promise<(YouTubeMetricRow & { available: boolean }) | null> {
  if (!_accessToken || !_mediaId) {
    return null;
  }

  // Placeholder until Instagram OAuth + media IDs are wired.
  return {
    available: false,
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    reach: 0,
    saves: 0,
    watchTimeSeconds: 0,
    avgViewDurationSeconds: 0,
    ctr: 0,
    completionRate: 0,
  };
}
