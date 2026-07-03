import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createQueuedJob, triggerJobProcessor } from '@/lib/jobQueue';
import { runQueuedJob } from '@/lib/processJob';

/** Create async processing job — returns immediately (202). */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { type, jobId: requestedJobId, ...payload } = body;
  if (!type) {
    return NextResponse.json({ error: 'Missing job type' }, { status: 400 });
  }

  const jobId = await createQueuedJob(userId, { type, ...payload }, requestedJobId);
  const origin = req.nextUrl.origin;

  after(() => {
    void runQueuedJob(jobId, origin).catch((err) => {
      console.error('[JobQueue] Inline process failed:', err);
    });
  });
  triggerJobProcessor(jobId, origin);

  return NextResponse.json({ jobId, status: 'queued' }, { status: 202 });
}
