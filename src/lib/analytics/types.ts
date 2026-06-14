import type { AnalyticsPlatform } from '@/models/ClipMetric';

export type PlatformMetrics = {
  platform: AnalyticsPlatform;
  connected: boolean;
  available: boolean;
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
  lastSyncedAt?: string;
};

export type ClipAnalyticsResponse = {
  clipId: string;
  platforms: PlatformMetrics[];
  totals: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    watchTimeSeconds: number;
    avgCompletionRate: number;
    ctr: number;
  };
  trend: { date: string; views: number }[];
  bestEngagementHour: number | null;
  refreshedAt: string;
  stale: boolean;
};

export type DashboardAnalyticsSummary = {
  topClip: { clipId: string; title: string; views: number } | null;
  totalReachThisMonth: number;
  averageWatchTimeSeconds: number;
  averageCompletionRate: number;
  weekOverWeek: {
    viewsThisWeek: number;
    viewsLastWeek: number;
    changePercent: number;
  };
  refreshedAt: string;
};

export function emptyPlatformMetrics(platform: AnalyticsPlatform, connected: boolean): PlatformMetrics {
  return {
    platform,
    connected,
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

export function aggregatePlatformMetrics(platforms: PlatformMetrics[]) {
  const available = platforms.filter((p) => p.available);
  const views = available.reduce((sum, p) => sum + p.views, 0);
  const likes = available.reduce((sum, p) => sum + p.likes, 0);
  const comments = available.reduce((sum, p) => sum + p.comments, 0);
  const shares = available.reduce((sum, p) => sum + p.shares, 0);
  const watchTimeSeconds = available.reduce((sum, p) => sum + p.watchTimeSeconds, 0);
  const completionRates = available.map((p) => p.completionRate).filter((v) => v > 0);
  const ctrValues = available.map((p) => p.ctr).filter((v) => v > 0);

  return {
    views,
    likes,
    comments,
    shares,
    watchTimeSeconds,
    avgCompletionRate:
      completionRates.length > 0
        ? completionRates.reduce((a, b) => a + b, 0) / completionRates.length
        : 0,
    ctr: ctrValues.length > 0 ? ctrValues.reduce((a, b) => a + b, 0) / ctrValues.length : 0,
  };
}

export function computeBestEngagementHour(
  snapshots: { capturedAt: Date; views: number; likes: number; comments: number }[]
): number | null {
  if (snapshots.length < 2) return null;

  const hourly = new Map<number, number>();
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
  );

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const delta =
      Math.max(0, curr.views - prev.views) +
      Math.max(0, curr.likes - prev.likes) * 3 +
      Math.max(0, curr.comments - prev.comments) * 5;
    if (delta <= 0) continue;
    const hour = new Date(curr.capturedAt).getHours();
    hourly.set(hour, (hourly.get(hour) || 0) + delta);
  }

  let bestHour: number | null = null;
  let bestScore = 0;
  hourly.forEach((score, hour) => {
    if (score > bestScore) {
      bestScore = score;
      bestHour = hour;
    }
  });
  return bestHour;
}

export function buildSevenDayTrend(
  snapshots: { capturedAt: Date; views: number }[]
): { date: string; views: number }[] {
  const byDay = new Map<string, number>();
  const now = new Date();

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }

  snapshots.forEach((row) => {
    const key = new Date(row.capturedAt).toISOString().slice(0, 10);
    if (byDay.has(key)) {
      byDay.set(key, Math.max(byDay.get(key) || 0, row.views));
    }
  });

  return Array.from(byDay.entries()).map(([date, views]) => ({ date, views }));
}
