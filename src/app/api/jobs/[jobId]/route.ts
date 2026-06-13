import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getJob } from '@/lib/jobQueue';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId } = await params;
  const job = await getJob(jobId);
  if (!job || job.userId !== userId) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    jobId: job.jobId,
    status: job.queueStatus || 'queued',
    step: job.step,
    message: job.message,
    progress: job.progress,
    outputUrls: job.outputUrls || [],
    error: job.errorMessage || null,
    finalPath: job.finalPath,
    analysis: job.analysis,
  });
}
