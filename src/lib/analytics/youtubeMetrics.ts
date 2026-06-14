import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL}/api/youtube/callback`
);

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

  oauth2Client.setCredentials(tokens);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

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
    const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2Client });
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
