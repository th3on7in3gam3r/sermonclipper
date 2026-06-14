import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isVesperAdmin } from '@/lib/adminBypass';
import { getMetricsSnapshot } from '@/lib/telemetry/metrics';
import { getJobQueueDepth } from '@/lib/jobQueue';

export async function GET() {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  if (!userId || !isVesperAdmin(userId, clerkUser)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await getJobQueueDepth();
  const metrics = getMetricsSnapshot(5 * 60_000);

  return NextResponse.json({
    ...metrics,
    sentryEnabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
    otelEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || null,
    alertThresholds: {
      clipsP95Ms: 500,
      errorRatePercent: 1,
      queueDepth: 50,
      memoryPercent: 85,
    },
  });
}
