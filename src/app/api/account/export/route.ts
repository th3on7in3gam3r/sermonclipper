import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import DataExportRequest from '@/models/DataExportRequest';
import { createQueuedJob, triggerJobProcessor } from '@/lib/jobQueue';
import { logAuditEvent } from '@/lib/auditLog';
import { SITE_URL } from '@/lib/siteConfig';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const pending = await DataExportRequest.findOne({
    userId,
    status: { $in: ['queued', 'processing'] },
  }).lean();
  if (pending) {
    return NextResponse.json({
      ok: true,
      jobId: pending.jobId,
      status: pending.status,
      message: 'An export is already in progress.',
    });
  }

  const jobId = await createQueuedJob(userId, { type: 'data_export', userId });
  await DataExportRequest.create({
    userId,
    jobId,
    status: 'queued',
    requestedAt: new Date(),
  });

  await logAuditEvent({
    userId,
    eventType: 'data.export_requested',
    metadata: { jobId },
  });

  triggerJobProcessor(jobId, req.nextUrl.origin || SITE_URL);

  return NextResponse.json({
    ok: true,
    jobId,
    status: 'queued',
    message: 'Your data export will be ready in 5–15 minutes. We\'ll email you a download link.',
  });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const latest = await DataExportRequest.findOne({ userId }).sort({ requestedAt: -1 }).lean();
  if (!latest) {
    return NextResponse.json({ status: 'none' });
  }

  return NextResponse.json({
    jobId: latest.jobId,
    status: latest.status,
    downloadUrl: latest.status === 'complete' ? latest.downloadUrl : undefined,
    expiresAt: latest.expiresAt,
    requestedAt: latest.requestedAt,
    errorMessage: latest.errorMessage,
  });
}
