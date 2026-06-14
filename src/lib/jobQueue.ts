import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import JobProgress from '@/models/JobProgress';
import { setQueueDepth } from '@/lib/telemetry/metrics';

export type JobQueueStatus = 'queued' | 'processing' | 'complete' | 'failed';

export async function createQueuedJob(
  userId: string,
  payload: Record<string, unknown>,
  existingJobId?: string
) {
  await connectDB();
  const jobId = existingJobId || uuidv4().slice(0, 12);
  await JobProgress.findOneAndUpdate(
    { jobId },
    {
      $set: {
        userId,
        queueStatus: 'queued',
        status: 'pending',
        step: 'Queued',
        message: 'Waiting for processing',
        payload,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );
  return jobId;
}

export async function getJobQueueDepth() {
  await connectDB();
  const depth = await JobProgress.countDocuments({ queueStatus: { $in: ['queued', 'processing'] } });
  setQueueDepth(depth);
  return depth;
}

export async function getJob(jobId: string) {
  await connectDB();
  return JobProgress.findOne({ jobId }).lean();
}

export async function updateJobQueue(
  jobId: string,
  update: Partial<{
    queueStatus: JobQueueStatus;
    status: string;
    step: string;
    message: string;
    progress: number;
    retryCount: number;
    errorMessage: string;
    outputUrls: string[];
    finalPath: string;
    analysis: Record<string, unknown>;
  }>
) {
  await connectDB();
  await JobProgress.updateOne({ jobId }, { $set: { ...update, updatedAt: new Date() } });
}

/** Trigger async processing (fire-and-forget from API routes). */
export function triggerJobProcessor(jobId: string, origin: string) {
  const secret = process.env.CRON_SECRET;
  const url = `${origin}/api/jobs/process?jobId=${encodeURIComponent(jobId)}`;
  fetch(url, {
    method: 'POST',
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
  }).catch((err) => console.error('[JobQueue] Failed to trigger processor:', err));
}
