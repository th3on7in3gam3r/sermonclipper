import { NextRequest, NextResponse } from 'next/server';
import * as dns from 'dns';
import { auth } from '@clerk/nextjs/server';
import { withTelemetry } from '@/lib/telemetry/apiHandler';
import { progressManager } from '@/lib/progress';
import { PlanLimitError, processSermonAnalysis } from '@/lib/sermonAnalysis';

function authorizeInternal(req: NextRequest): string | null {
  const secret = process.env.CRON_SECRET;
  const previous = process.env.CRON_SECRET_PREVIOUS;
  if (!secret && !previous) return null;

  const authHeader = req.headers.get('authorization');
  const valid =
    (secret && authHeader === `Bearer ${secret}`) ||
    (previous && authHeader === `Bearer ${previous}`);
  if (!valid) return null;

  return req.headers.get('x-vesper-user-id');
}

try {
  dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8']);
} catch {
  console.warn('[Engine] DNS redundancy active.');
}

async function postHandler(req: NextRequest) {
  const body = await req.json();
  const { url, jobId, manuscript, preacherName } = body as {
    url?: string;
    jobId?: string;
    manuscript?: string;
    preacherName?: string;
  };

  if (!url || !jobId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const internalUserId = authorizeInternal(req);
  const { userId: clerkUserId } = await auth();
  const userId = clerkUserId || internalUserId;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
  }

  const sermonContext = {
    manuscript: typeof manuscript === 'string' ? manuscript.trim() : undefined,
    preacherName: typeof preacherName === 'string' ? preacherName.trim() : undefined,
  };

  try {
    await processSermonAnalysis({ url, jobId, userId, context: sermonContext });
    return NextResponse.json({ success: true, jobId });
  } catch (e: unknown) {
    if (e instanceof PlanLimitError) {
      return NextResponse.json(
        { error: 'Plan limit reached', details: e.message, code: e.code },
        { status: 403 }
      );
    }

    const errorMsg = e instanceof Error ? e.message : 'Unknown Neural Error';
    console.error('[Engine] Synchronous Failure:', e);

    await progressManager.update(jobId, {
      step: 'Analysis',
      status: 'error',
      message: `[Neural Error] ${errorMsg}`,
    });

    return NextResponse.json(
      {
        error: 'Neural Engine Failure',
        details: errorMsg,
        code: (e as { code?: string })?.code || '500',
      },
      { status: 500 }
    );
  }
}

export const POST = withTelemetry(postHandler, 'POST /api/download-youtube');
