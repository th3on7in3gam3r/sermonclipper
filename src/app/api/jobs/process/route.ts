import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { getJob, updateJobQueue } from '@/lib/jobQueue';
import { createNotification } from '@/lib/notifications';
import { progressManager } from '@/lib/progress';

const MAX_RETRIES = 3;

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

/** Background worker entry — processes one queued job. */
export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  const job = await getJob(jobId);
  if (!job || job.queueStatus === 'complete' || job.queueStatus === 'processing') {
    return NextResponse.json({ skipped: true });
  }

  const retryCount = job.retryCount || 0;
  if (retryCount >= MAX_RETRIES && job.queueStatus === 'failed') {
    return NextResponse.json({ error: 'Max retries exceeded' }, { status: 429 });
  }

  await updateJobQueue(jobId, {
    queueStatus: 'processing',
    status: 'loading',
    step: 'Processing',
    message: 'Starting pipeline…',
  });

  try {
    const payload = (job.payload || {}) as {
      type?: string;
      url?: string;
      userId?: string;
      finalPath?: string;
    };
    const origin = req.nextUrl.origin;

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

      return NextResponse.json({ success: true, jobId, downloadUrl });
    } else if (payload.type === 'youtube' && payload.url) {
      const secret = process.env.CRON_SECRET;
      const res = await fetch(`${origin}/api/download-youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret
            ? {
                Authorization: `Bearer ${secret}`,
                'x-vesper-user-id': job.userId || '',
              }
            : { Cookie: req.headers.get('cookie') || '' }),
        },
        body: JSON.stringify({ url: payload.url, jobId, userId: job.userId }),
      });
      if (!res.ok) throw new Error(`Pipeline failed (${res.status})`);
    } else if (payload.type === 'upload') {
      await progressManager.update(jobId, {
        step: 'Upload',
        status: 'completed',
        message: 'Upload validated',
        finalPath: payload.finalPath || '',
      });
    }

    const final = await getJob(jobId);
    await updateJobQueue(jobId, {
      queueStatus: 'complete',
      status: 'completed',
      step: 'Complete',
      message: 'Processing complete',
      outputUrls: final?.finalPath ? [final.finalPath] : [],
    });

    if (job.userId) {
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
        userId: job.userId,
        type: 'clip_ready',
        message: `Your clip is ready: "${clipTitle}" — tap to view`,
        link: `/results?jobId=${jobId}`,
        pushTitle: 'Clip ready',
      });
    }

    return NextResponse.json({ success: true, jobId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Processing failed';
    Sentry.captureException(error, { tags: { jobId } });

    const nextRetry = retryCount + 1;
    const failed = nextRetry >= MAX_RETRIES;

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
        fetch(`${req.nextUrl.origin}/api/jobs/process?jobId=${encodeURIComponent(jobId)}`, {
          method: 'POST',
          headers: req.headers.get('authorization')
            ? { Authorization: req.headers.get('authorization')! }
            : {},
        }).catch(() => {});
      }, delayMs);
    }

    return NextResponse.json({ error: msg, retryCount: nextRetry }, { status: 500 });
  }
}
