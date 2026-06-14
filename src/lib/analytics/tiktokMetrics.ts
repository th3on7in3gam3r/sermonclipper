import type { YouTubeMetricRow } from '@/lib/analytics/youtubeMetrics';

/** TikTok Content Posting API metrics — requires app credentials. */
export async function fetchTikTokVideoMetrics(
  _accessToken: string | undefined,
  _videoId: string
): Promise<(YouTubeMetricRow & { available: boolean }) | null> {
  if (!_accessToken || !_videoId) {
    return null;
  }

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
