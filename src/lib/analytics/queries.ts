import connectDB from '@/lib/mongodb';
import ClipMetric from '@/models/ClipMetric';
import ClipPublication from '@/models/ClipPublication';
import User from '@/models/User';
import Sermon from '@/models/Sermon';
import { parseClipId } from '@/lib/api/v1/clips';
import {
  aggregatePlatformMetrics,
  buildSevenDayTrend,
  computeBestEngagementHour,
  emptyPlatformMetrics,
  type ClipAnalyticsResponse,
  type DashboardAnalyticsSummary,
} from '@/lib/analytics/types';

const STALE_MS = 6 * 60 * 60 * 1000;

export async function getClipAnalytics(userId: string, clipId: string): Promise<ClipAnalyticsResponse> {
  await connectDB();
  const user = await User.findOne({ clerkId: userId }).lean();
  const publications = await ClipPublication.find({ userId, clipId }).lean();
  const snapshots = await ClipMetric.find({ userId, clipId }).sort({ capturedAt: -1 }).limit(200).lean();

  const latestByPlatform = new Map<string, (typeof snapshots)[number]>();
  snapshots.forEach((row) => {
    if (!latestByPlatform.has(row.platform)) latestByPlatform.set(row.platform, row);
  });

  const platforms = (['youtube', 'instagram', 'tiktok'] as const).map((platform) => {
    const connected =
      platform === 'youtube'
        ? Boolean(user?.youtubeTokens)
        : Boolean((user?.socialConnections as Record<string, boolean> | undefined)?.[platform]);
    const latest = latestByPlatform.get(platform);
    const published = publications.some((p) => p.platform === platform);

    if (!latest) {
      return {
        ...emptyPlatformMetrics(platform, connected),
        available: published && connected,
      };
    }

    return {
      platform,
      connected,
      available: true,
      views: latest.views,
      likes: latest.likes,
      comments: latest.comments,
      shares: latest.shares,
      reach: latest.reach,
      saves: latest.saves,
      watchTimeSeconds: latest.watchTimeSeconds,
      avgViewDurationSeconds: latest.avgViewDurationSeconds,
      ctr: latest.ctr,
      completionRate: latest.completionRate,
      lastSyncedAt: latest.capturedAt?.toISOString(),
    };
  });

  const totals = aggregatePlatformMetrics(platforms);
  const trend = buildSevenDayTrend(
    snapshots.map((s) => ({ capturedAt: s.capturedAt, views: s.views }))
  );
  const bestEngagementHour = computeBestEngagementHour(
    snapshots.map((s) => ({
      capturedAt: s.capturedAt,
      views: s.views,
      likes: s.likes,
      comments: s.comments,
    }))
  );

  const lastSnapshot = snapshots[0]?.capturedAt;
  const stale = !lastSnapshot || Date.now() - new Date(lastSnapshot).getTime() > STALE_MS;

  return {
    clipId,
    platforms,
    totals,
    trend,
    bestEngagementHour,
    refreshedAt: lastSnapshot?.toISOString() || new Date().toISOString(),
    stale,
  };
}

export async function getDashboardAnalyticsSummary(userId: string): Promise<DashboardAnalyticsSummary> {
  await connectDB();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const monthSnapshots = await ClipMetric.find({
    userId,
    capturedAt: { $gte: monthStart },
  }).lean();

  const weekSnapshots = monthSnapshots.filter((s) => new Date(s.capturedAt) >= weekStart);
  const prevWeekSnapshots = monthSnapshots.filter(
    (s) => new Date(s.capturedAt) >= prevWeekStart && new Date(s.capturedAt) < weekStart
  );

  const latestByClip = new Map<string, (typeof monthSnapshots)[number]>();
  monthSnapshots.forEach((row) => {
    const key = `${row.clipId}:${row.platform}`;
    const existing = latestByClip.get(key);
    if (!existing || new Date(row.capturedAt) > new Date(existing.capturedAt)) {
      latestByClip.set(key, row);
    }
  });

  const clipViews = new Map<string, number>();
  latestByClip.forEach((row) => {
    clipViews.set(row.clipId, (clipViews.get(row.clipId) || 0) + row.views);
  });

  const topEntry = [...clipViews.entries()].sort((a, b) => b[1] - a[1])[0];
  let topClip: { clipId: string; title: string; views: number } | null = topEntry
    ? { clipId: topEntry[0], title: topEntry[0], views: topEntry[1] }
    : null;

  if (topClip) {
    const current = topClip;
    const parsed = parseClipId(current.clipId);
    if (parsed) {
      const sermon = await Sermon.findOne({ userId, jobId: parsed.jobId }).lean();
      const clip = (sermon?.analysis as { clips?: Record<string, unknown>[] } | undefined)?.clips?.[
        parsed.index
      ];
      const title =
        (clip?.hook_title as string) ||
        (clip?.main_quote as string) ||
        sermon?.title ||
        current.clipId;
      topClip = { ...current, title };
    }
  }

  const totalReachThisMonth = Array.from(latestByClip.values()).reduce((sum, row) => sum + row.reach, 0);
  const watchRows = Array.from(latestByClip.values()).filter((r) => r.avgViewDurationSeconds > 0);
  const averageWatchTimeSeconds =
    watchRows.length > 0
      ? watchRows.reduce((sum, r) => sum + r.avgViewDurationSeconds, 0) / watchRows.length
      : 0;
  const completionRows = Array.from(latestByClip.values()).filter((r) => r.completionRate > 0);
  const averageCompletionRate =
    completionRows.length > 0
      ? completionRows.reduce((sum, r) => sum + r.completionRate, 0) / completionRows.length
      : 0;

  const viewsThisWeek = weekSnapshots.reduce((sum, r) => sum + r.views, 0);
  const viewsLastWeek = prevWeekSnapshots.reduce((sum, r) => sum + r.views, 0);
  const changePercent =
    viewsLastWeek > 0 ? Math.round(((viewsThisWeek - viewsLastWeek) / viewsLastWeek) * 100) : viewsThisWeek > 0 ? 100 : 0;

  const lastSnapshot = monthSnapshots.sort(
    (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
  )[0];

  return {
    topClip,
    totalReachThisMonth,
    averageWatchTimeSeconds,
    averageCompletionRate,
    weekOverWeek: { viewsThisWeek, viewsLastWeek, changePercent },
    refreshedAt: lastSnapshot?.capturedAt?.toISOString() || new Date().toISOString(),
  };
}
