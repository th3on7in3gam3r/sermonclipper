import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PodcastFeed from '@/models/PodcastFeed';
import { fetchPodcastEpisodesServer } from '@/lib/podcast/parseFeed';
import { createQueuedJob, triggerJobProcessor } from '@/lib/jobQueue';
import { createNotification } from '@/lib/notifications';
import { SITE_URL } from '@/lib/siteConfig';

/** Daily poll for new podcast episodes. */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const feeds = await PodcastFeed.find({ autoProcess: true }).limit(100).lean();
  let queued = 0;

  for (const feed of feeds) {
    try {
      const { episodes } = await fetchPodcastEpisodesServer(feed.feedUrl, 5);
      const latest = episodes[0];
      if (!latest || latest.guid === feed.lastEpisodeGuid) continue;

      const jobId = await createQueuedJob(feed.userId, {
        type: 'youtube',
        url: latest.audioUrl,
        source: 'podcast',
        episodeTitle: latest.title,
      });

      triggerJobProcessor(jobId, req.nextUrl.origin || SITE_URL);

      await PodcastFeed.updateOne(
        { _id: feed._id },
        { $set: { lastEpisodeGuid: latest.guid, lastPolledAt: new Date() } }
      );

      await createNotification({
        userId: feed.userId,
        type: 'podcast_new_episode',
        message: `New episode detected: "${latest.title}" — processing has started`,
        link: `/results?jobId=${jobId}`,
        pushTitle: 'New podcast episode',
      });

      queued += 1;
    } catch {
      /* skip bad feed */
    }
  }

  return NextResponse.json({ ok: true, feeds: feeds.length, queued });
}
