import connectDB from '@/lib/mongodb';
import Sermon from '@/models/Sermon';
import JobProgress from '@/models/JobProgress';
import { getMediaDeliveryUrl } from '@/lib/cdn';
import { detectBibleReferences } from '@/lib/bibleVerses';
import { isYouTubeUrl } from '@/lib/videoSource';

export function parseClipId(clipId: string): { jobId: string; index: number } | null {
  const idx = clipId.lastIndexOf(':');
  if (idx <= 0) return null;
  const jobId = clipId.slice(0, idx);
  const index = Number.parseInt(clipId.slice(idx + 1), 10);
  if (Number.isNaN(index) || index < 0) return null;
  return { jobId, index };
}

export function formatClipId(jobId: string, index: number) {
  return `${jobId}:${index}`;
}

type RawClip = Record<string, unknown>;

export async function listClipsForUser(userId: string, sourceId?: string) {
  await connectDB();
  const query: Record<string, unknown> = { userId };
  if (sourceId) query.jobId = sourceId;

  const sermons = await Sermon.find(query).sort({ createdAt: -1 }).lean();
  const clips: ReturnType<typeof serializeClip>[] = [];

  for (const sermon of sermons) {
    const analysis = sermon.analysis as { clips?: RawClip[] } | undefined;
    const list = analysis?.clips || [];
    list.forEach((clip, index) => {
      clips.push(
        serializeClip({
          jobId: sermon.jobId,
          index,
          clip,
          sermon,
        })
      );
    });
  }

  return clips;
}

export async function getClipForUser(userId: string, clipId: string) {
  const parsed = parseClipId(clipId);
  if (!parsed) return null;

  await connectDB();
  const sermon = await Sermon.findOne({ userId, jobId: parsed.jobId }).lean();
  if (!sermon) return null;

  const analysis = sermon.analysis as { clips?: RawClip[] } | undefined;
  const clip = analysis?.clips?.[parsed.index];
  if (!clip) return null;

  return serializeClip({ jobId: parsed.jobId, index: parsed.index, clip, sermon });
}

function serializeClip(input: {
  jobId: string;
  index: number;
  clip: RawClip;
  sermon: { jobId: string; title?: string; finalPath?: string; videoUrl?: string; createdAt?: Date };
}) {
  const { jobId, index, clip, sermon } = input;
  const text = String(clip.main_quote || clip.hook_title || '');
  const verses = detectBibleReferences(text);

  return {
    id: formatClipId(jobId, index),
    sourceId: jobId,
    index,
    title: String(clip.hook_title || clip.main_quote || `Clip ${index + 1}`),
    quote: String(clip.main_quote || ''),
    start: clip.start,
    end: clip.end,
    impactScore: clip.impact_score ?? clip.viral_score,
    captions: clip.suggested_captions || [],
    engagementHook: clip.engagement_hook,
    hasScripture: verses.length > 0,
    scriptureReferences: verses.map((v) => v.reference),
    sermonTitle: sermon.title,
    createdAt: sermon.createdAt,
  };
}

export async function getSourceForUser(userId: string, sourceId: string) {
  await connectDB();
  const [job, sermon] = await Promise.all([
    JobProgress.findOne({ jobId: sourceId, userId }).lean(),
    Sermon.findOne({ jobId: sourceId, userId }).lean(),
  ]);

  if (!job && !sermon) return null;

  const status = mapSourceStatus(job);
  const analysis = sermon?.analysis as { clips?: unknown[] } | undefined;

  return {
    id: sourceId,
    status: status.status,
    step: status.step,
    progress: job?.progress ?? (status.status === 'complete' ? 100 : 0),
    error: job?.errorMessage || null,
    finalPath: job?.finalPath || sermon?.finalPath || null,
    videoUrl: sermon?.videoUrl || null,
    clipCount: analysis?.clips?.length ?? 0,
    title: sermon?.title,
    createdAt: sermon?.createdAt || job?.updatedAt,
  };
}

function mapSourceStatus(job: { queueStatus?: string; status?: string; step?: string } | null) {
  if (!job) return { status: 'complete' as const, step: 'Done' };
  const qs = job.queueStatus || 'queued';
  if (qs === 'failed') return { status: 'failed' as const, step: job.step || 'Failed' };
  if (qs === 'complete' || job.status === 'completed') return { status: 'complete' as const, step: 'Done' };
  if (qs === 'processing') return { status: 'processing' as const, step: job.step || 'Processing' };
  return { status: 'queued' as const, step: job.step || 'Queued' };
}

export async function resolveClipDownloadUrl(
  userId: string,
  clipId: string,
  renderUrl?: string
): Promise<string | null> {
  if (renderUrl) return renderUrl;

  const clip = await getClipForUser(userId, clipId);
  if (!clip) return null;

  await connectDB();
  const sermon = await Sermon.findOne({ userId, jobId: clip.sourceId }).lean();
  const master = sermon?.finalPath || sermon?.videoUrl;
  if (!master || isYouTubeUrl(master)) return null;

  try {
    return await getMediaDeliveryUrl(master);
  } catch {
    return null;
  }
}
