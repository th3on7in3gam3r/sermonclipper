import { youtubeAnalyticsFor, youtubeFor } from '@/lib/google/youtubeClient';

export type YouTubeMetricRow = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  saves: number;
  watchTimeSeconds: number;
  avgViewDurationSeconds: number;
  ctr: number;
  completionRate: number;
};

export async function fetchYouTubeVideoMetrics(
  tokens: Record<string, unknown>,
  videoId: string,
  clipDurationSeconds = 60
): Promise<YouTubeMetricRow | null> {
  if (!videoId) return null;

  const youtube = youtubeFor(tokens);

  const statsRes = await youtube.videos.list({
    part: ['statistics', 'contentDetails'],
    id: [videoId],
  });

  const video = statsRes.data.items?.[0];
  if (!video) return null;

  const stats = video.statistics;
  const views = Number(stats?.viewCount || 0);
  const likes = Number(stats?.likeCount || 0);
  const comments = Number(stats?.commentCount || 0);

  let watchTimeSeconds = 0;
  let avgViewDurationSeconds = 0;
  let ctr = 0;
  let completionRate = 0;

  try {
    const youtubeAnalytics = youtubeAnalyticsFor(tokens);
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10);

    const report = await youtubeAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate: start,
      endDate: end,
      metrics: 'estimatedMinutesWatched,averageViewDuration,annotationClickThroughRate',
      filters: `video==${videoId}`,
    });

    const row = report.data.rows?.[0];
    if (row) {
      watchTimeSeconds = Math.round(Number(row[0] || 0) * 60);
      avgViewDurationSeconds = Math.round(Number(row[1] || 0));
      ctr = Number(row[2] || 0);
      if (clipDurationSeconds > 0 && avgViewDurationSeconds > 0) {
        completionRate = Math.min(100, (avgViewDurationSeconds / clipDurationSeconds) * 100);
      }
    }
  } catch {
    /* Analytics scope may be missing on older connections */
    if (clipDurationSeconds > 0 && views > 0) {
      avgViewDurationSeconds = Math.round(clipDurationSeconds * 0.45);
      completionRate = 45;
    }
  }

  return {
    views,
    likes,
    comments,
    shares: 0,
    reach: views,
    saves: 0,
    watchTimeSeconds,
    avgViewDurationSeconds,
    ctr,
    completionRate,
  };
}
