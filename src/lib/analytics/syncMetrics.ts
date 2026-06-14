import connectDB from '@/lib/mongodb';
import ClipMetric from '@/models/ClipMetric';
import ClipPublication from '@/models/ClipPublication';
import User from '@/models/User';
import Sermon from '@/models/Sermon';
import { parseClipId } from '@/lib/api/v1/clips';
import { fetchYouTubeVideoMetrics } from '@/lib/analytics/youtubeMetrics';
import { fetchInstagramReelMetrics } from '@/lib/analytics/instagramMetrics';
import { fetchTikTokVideoMetrics } from '@/lib/analytics/tiktokMetrics';
import type { AnalyticsPlatform } from '@/models/ClipMetric';

function parseTime(timeVal: unknown): number {
  if (typeof timeVal === 'number') return timeVal;
  if (!timeVal) return 0;
  const str = String(timeVal);
  if (str.includes(':')) {
    const parts = str.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }
  return parseFloat(str) || 60;
}

async function getClipDurationSeconds(clipId: string): Promise<number> {
  const parsed = parseClipId(clipId);
  if (!parsed) return 60;
  const sermon = await Sermon.findOne({ jobId: parsed.jobId }).lean();
  const clips = (sermon?.analysis as { clips?: Record<string, unknown>[] } | undefined)?.clips;
  const clip = clips?.[parsed.index];
  if (!clip) return 60;
  return Math.max(parseTime(clip.end) - parseTime(clip.start), 1);
}

export async function syncClipMetricsForUser(userId: string) {
  await connectDB();
  const user = await User.findOne({ clerkId: userId }).lean();
  if (!user) return { synced: 0 };

  const publications = await ClipPublication.find({ userId }).lean();
  type YtTestRow = { videoId?: string; clipIndex?: number; clipId?: string };
  const legacyYoutube = ((user.youtubeThumbnailTests || []) as YtTestRow[])
    .filter((row) => row?.videoId)
    .map((row) => ({
      clipId:
        row.clipId ||
        (row.clipIndex != null && publications[0]?.clipId
          ? `${publications[0].clipId.split(':')[0]}:${row.clipIndex}`
          : ''),
      platform: 'youtube' as AnalyticsPlatform,
      externalId: String(row.videoId),
    }))
    .filter((row) => row.clipId && !row.clipId.includes('undefined'));

  const targets = [
    ...publications.map((p) => ({
      clipId: p.clipId,
      platform: p.platform,
      externalId: p.externalId,
    })),
    ...legacyYoutube,
  ];

  let synced = 0;
  const capturedAt = new Date();

  for (const target of targets) {
    if (!target.externalId || !target.clipId) continue;

    const duration = await getClipDurationSeconds(target.clipId);
    let metrics: Awaited<ReturnType<typeof fetchYouTubeVideoMetrics>> | null = null;

    if (target.platform === 'youtube' && user.youtubeTokens) {
      metrics = await fetchYouTubeVideoMetrics(
        user.youtubeTokens as Record<string, unknown>,
        target.externalId,
        duration
      );
    } else if (target.platform === 'instagram') {
      const row = await fetchInstagramReelMetrics(undefined, target.externalId);
      if (row?.available) metrics = row;
    } else if (target.platform === 'tiktok') {
      const row = await fetchTikTokVideoMetrics(undefined, target.externalId);
      if (row?.available) metrics = row;
    }

    if (!metrics) continue;

    await ClipMetric.create({
      userId,
      clipId: target.clipId,
      platform: target.platform,
      views: metrics.views,
      likes: metrics.likes,
      comments: metrics.comments,
      shares: metrics.shares,
      reach: metrics.reach,
      saves: metrics.saves,
      watchTimeSeconds: metrics.watchTimeSeconds,
      avgViewDurationSeconds: metrics.avgViewDurationSeconds,
      ctr: metrics.ctr,
      completionRate: metrics.completionRate,
      capturedAt,
    });
    synced += 1;
  }

  return { synced };
}

export async function syncAllUserMetrics(limit = 100) {
  await connectDB();
  const userIds = await ClipPublication.distinct('userId');
  const youtubeUsers = await User.find({ 'youtubeTokens.access_token': { $exists: true } })
    .select('clerkId')
    .limit(limit)
    .lean();
  const merged = new Set<string>([...userIds, ...youtubeUsers.map((u) => u.clerkId)]);

  let totalSynced = 0;
  for (const userId of Array.from(merged).slice(0, limit)) {
    const result = await syncClipMetricsForUser(userId);
    totalSynced += result.synced;
  }
  return { users: merged.size, synced: totalSynced };
}
