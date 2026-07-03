import * as Sentry from '@sentry/nextjs';
import { getJob, updateJobQueue, getJobQueueDepth } from '@/lib/jobQueue';
import { createNotification } from '@/lib/notifications';
import { progressManager } from '@/lib/progress';
import { traceJob } from '@/lib/telemetry/spans';

const MAX_RETRIES = 3;
const STALE_PROCESSING_MS = 10 * 60 * 1000;

type JobPayload = {
  type?: string;
  url?: string;
  userId?: string;
  finalPath?: string;
  manuscript?: string;
  preacherName?: string;
};

export type ProcessJobResult =
  | { ok: true; jobId: string }
  | { ok: false; skipped?: boolean; error?: string; retryCount?: number };

async function runMediaPipeline(
  origin: string,
  jobId: string,
  userId: string | undefined,
  payload: JobPayload,
  cookieHeader?: string
) {
  const mediaUrl = payload.url || payload.finalPath;
  if (!mediaUrl) {
    throw new Error('Missing media URL for processing job');
  }

  const secret = process.env.CRON_SECRET;
  const res = await fetch(`${origin}/api/download-youtube`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(secret
        ? {
            Authorization: `Bearer ${secret}`,
            'x-vesper-user-id': userId || '',
          }
        : cookieHeader
          ? { Cookie: cookieHeader }
          : {}),
    },
    body: JSON.stringify({
      url: mediaUrl,
      jobId,
      userId,
      manuscript: payload.manuscript,
      preacherName: payload.preacherName,
    }),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as { details?: string; error?: string };
    throw new Error(errBody.details || errBody.error || `Pipeline failed (${res.status})`);
  }
}

async function notifyClipReady(jobId: string, userId: string) {
  const Sermon = (await import('@/models/Sermon')).default;
  const connectDB = (await import('@/lib/mongodb')).default;
  await connectDB();
  const sermon = await Sermon.findOne({ jobId }).lean();
  const clipTitle =
    sermon?.analysis?.clips?.[0]?.hook_title ||
    sermon?.analysis?.clips?.[0]?.main_quote ||
    sermon?.title ||
    'Your clip';
  await createNotification({
    userId,
    type: 'clip_ready',
    message: `Your clip is ready: "${clipTitle}" — tap to view`,
    link: `/results?jobId=${jobId}`,
    pushTitle: 'Clip ready',
  });
}

async function finalizeSuccessfulJob(jobId: string, userId?: string) {
  const progress = await progressManager.get(jobId);
  if (progress?.status === 'error') {
    throw new Error(progress.message?.replace(/^\[Neural Error\]\s*/, '') || 'Analysis failed');
  }

  await updateJobQueue(jobId, {
    queueStatus: 'complete',
    status: 'completed',
    step: 'Complete',
    message: progress?.message || 'Processing complete',
    progress: 100,
    finalPath: progress?.finalPath || '',
    analysis: progress?.analysis,
    outputUrls: progress?.finalPath ? [progress.finalPath] : [],
  });

  if (userId) {
    await notifyClipReady(jobId, userId);
  }
}

/** Process one queued sermon job (upload or YouTube). */
export async function runQueuedJob(
  jobId: string,
  origin: string,
  options?: { cookieHeader?: string }
): Promise<ProcessJobResult> {
  const job = await getJob(jobId);
  if (!job) {
    return { ok: false, error: 'Job not found' };
  }

  const staleProcessing =
    job.queueStatus === 'processing' &&
    job.updatedAt &&
    Date.now() - new Date(job.updatedAt).getTime() > STALE_PROCESSING_MS;

  if (job.queueStatus === 'complete') {
    return { ok: false, skipped: true };
  }
  if (job.queueStatus === 'processing' && !staleProcessing) {
    return { ok: false, skipped: true };
  }

  const retryCount = job.retryCount || 0;
  if (retryCount >= MAX_RETRIES && job.queueStatus === 'failed') {
    return { ok: false, error: 'Max retries exceeded', retryCount };
  }

  if (staleProcessing) {
    await updateJobQueue(jobId, {
      queueStatus: 'queued',
      message: 'Retrying after timeout…',
    });
  }

  await updateJobQueue(jobId, {
    queueStatus: 'processing',
    status: 'loading',
    step: 'Analysis',
    message: 'Starting AI analysis…',
  });

  await getJobQueueDepth();

  try {
    await traceJob(jobId, async () => {
      const payload = (job.payload || {}) as JobPayload;

      if (payload.type === 'data_export' && payload.userId) {
        const DataExportRequest = (await import('@/models/DataExportRequest')).default;
        const User = (await import('@/models/User')).default;
        const { buildUserDataExportZip } = await import('@/lib/dataExport/buildUserExport');
        const { sendDataExportReadyEmail } = await import('@/lib/email');

        await DataExportRequest.updateOne({ jobId }, { $set: { status: 'processing' } });
        await updateJobQueue(jobId, {
          step: 'Export',
          message: 'Assembling your data package…',
          progress: 20,
        });

        const { downloadUrl } = await buildUserDataExportZip(String(payload.userId));
        const expiresAt = new Date(Date.now() + 48 * 3600 * 1000);

        await DataExportRequest.updateOne(
          { jobId },
          {
            $set: {
              status: 'complete',
              downloadUrl,
              expiresAt,
              completedAt: new Date(),
            },
          }
        );

        const dbUser = await User.findOne({ clerkId: payload.userId }).lean();
        if (dbUser?.email) {
          await sendDataExportReadyEmail(dbUser.email, downloadUrl, dbUser.emailUnsubscribeToken);
        }

        await updateJobQueue(jobId, {
          queueStatus: 'complete',
          status: 'completed',
          step: 'Complete',
          message: 'Data export ready',
          progress: 100,
          outputUrls: [downloadUrl],
        });
        return;
      }

      if ((payload.type === 'youtube' || payload.type === 'upload') && (payload.url || payload.finalPath)) {
        await runMediaPipeline(origin, jobId, job.userId, payload, options?.cookieHeader);
        await finalizeSuccessfulJob(jobId, job.userId);
        return;
      }

      throw new Error(`Unsupported job type: ${payload.type || 'unknown'}`);
    });

    return { ok: true, jobId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Processing failed';
    Sentry.captureException(error, { tags: { jobId } });

    const nextRetry = retryCount + 1;
    const failed = nextRetry >= MAX_RETRIES;

    await progressManager.update(jobId, {
      step: 'Analysis',
      status: 'error',
      message: `[Neural Error] ${msg}`,
    });

    await updateJobQueue(jobId, {
      queueStatus: failed ? 'failed' : 'queued',
      status: 'error',
      retryCount: nextRetry,
      errorMessage: msg,
      message: failed ? msg : `Retry ${nextRetry}/${MAX_RETRIES} scheduled`,
    });

    if (!failed) {
      const delayMs = Math.pow(2, nextRetry) * 1000;
      setTimeout(() => {
        void runQueuedJob(jobId, origin, options);
      }, delayMs);
    }

    return { ok: false, error: msg, retryCount: nextRetry };
  }
}
