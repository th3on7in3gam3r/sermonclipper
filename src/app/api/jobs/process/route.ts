import { NextRequest, NextResponse } from 'next/server';
import { runQueuedJob } from '@/lib/processJob';
import { withTelemetry } from '@/lib/telemetry/apiHandler';

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const previous = process.env.CRON_SECRET_PREVIOUS;
  if (!secret) return process.env.NODE_ENV === 'development';
  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${secret}` || (!!previous && authHeader === `Bearer ${previous}`);
}

/** Background worker entry — processes one queued job. */
async function postHandler(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  const result = await runQueuedJob(jobId, req.nextUrl.origin, {
    cookieHeader: req.headers.get('cookie') || undefined,
  });

  if (result.ok) {
    return NextResponse.json({ success: true, jobId: result.jobId });
  }
  if (result.skipped) {
    return NextResponse.json({ skipped: true });
  }

  return NextResponse.json(
    { error: result.error || 'Processing failed', retryCount: result.retryCount },
    { status: result.retryCount ? 500 : 404 }
  );
}

export const POST = withTelemetry(postHandler, 'POST /api/jobs/process');
