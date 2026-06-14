import { NextRequest, NextResponse } from 'next/server';
import { syncAllUserMetrics } from '@/lib/analytics/syncMetrics';

/** Vercel Cron: refresh social metrics every 6 hours — set CRON_SECRET in env. */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await syncAllUserMetrics(200);
  return NextResponse.json({ ok: true, ...result, syncedAt: new Date().toISOString() });
}
