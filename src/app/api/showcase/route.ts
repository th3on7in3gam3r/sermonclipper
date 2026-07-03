import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sermon from '@/models/Sermon';
import User from '@/models/User';
import ClipExport from '@/models/ClipExport';
import { getBrowserPlaybackUrl } from '@/lib/cdn';
import { SHOWCASE_FEATURED_CLIPS } from '@/lib/demoReelUrl';
import { isYouTubeUrl } from '@/lib/videoSource';

type ShowcaseClip = {
  clipId: string;
  churchName: string;
  caption: string;
  videoUrl: string;
  featured?: boolean;
};

async function resolveShowcaseVideoUrl(raw: string): Promise<string | null> {
  if (!raw || isYouTubeUrl(raw)) return null;
  if (raw.includes('://') && !raw.includes('.r2.cloudflarestorage.com')) {
    return raw;
  }
  try {
    return await getBrowserPlaybackUrl(raw);
  } catch {
    return null;
  }
}

export async function GET() {
  const clips: ShowcaseClip[] = SHOWCASE_FEATURED_CLIPS.map((clip) => ({
    ...clip,
    featured: true,
  }));

  try {
    await connectDB();

    const optedInUsers = await User.find({ showcaseOptIn: true }).select('clerkId whiteLabel').lean();
    const userIds = optedInUsers.map((u) => u.clerkId);
    if (!userIds.length) {
      return NextResponse.json({ clips });
    }

    const userMap = new Map(optedInUsers.map((u) => [u.clerkId, u]));
    const seen = new Set(clips.map((c) => c.clipId));

    const exports = await ClipExport.find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .limit(24)
      .lean();

    for (const row of exports) {
      if (clips.length >= 24) break;
      if (seen.has(row.clipId)) continue;

      const [jobId, indexStr] = row.clipId.split(':');
      const clipIndex = Number(indexStr);
      const sermon = jobId ? await Sermon.findOne({ jobId }).lean() : null;
      const analysisClip = sermon?.analysis?.clips?.[clipIndex] as
        | { hook_title?: string; main_quote?: string }
        | undefined;

      const churchName =
        (userMap.get(row.userId)?.whiteLabel as { churchName?: string } | undefined)?.churchName ||
        sermon?.title ||
        'Church partner';

      const videoUrl = await resolveShowcaseVideoUrl(row.renderUrl);
      if (!videoUrl) continue;

      clips.push({
        clipId: row.clipId,
        churchName,
        caption: analysisClip?.hook_title || analysisClip?.main_quote || sermon?.title || 'Sermon clip',
        videoUrl,
      });
      seen.add(row.clipId);
    }

    const sermons = await Sermon.find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();

    for (const sermon of sermons) {
      const analysis = sermon.analysis as { clips?: { hook_title?: string; main_quote?: string }[] } | undefined;
      const churchName =
        (userMap.get(sermon.userId)?.whiteLabel as { churchName?: string } | undefined)?.churchName ||
        sermon.title;

      for (const [clipIndex, clip] of (analysis?.clips || []).slice(0, 2).entries()) {
        if (clips.length >= 24) break;
        const clipId = `${sermon.jobId}:${clipIndex}`;
        if (seen.has(clipId)) continue;

        const raw = sermon.finalPath || sermon.videoUrl;
        const videoUrl = raw ? await resolveShowcaseVideoUrl(raw) : null;
        if (!videoUrl) continue;

        clips.push({
          clipId,
          churchName,
          caption: clip.hook_title || clip.main_quote || sermon.title,
          videoUrl,
        });
        seen.add(clipId);
      }
    }
  } catch (error) {
    console.error('[Showcase] Failed to load community clips:', error);
  }

  return NextResponse.json({ clips: clips.slice(0, 24) });
}
