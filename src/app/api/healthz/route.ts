import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { Redis } from '@upstash/redis';
import { getJobQueueDepth } from '@/lib/jobQueue';
import { pingPostgres } from '@/lib/postgres';
import { mongoCircuit, postgresCircuit } from '@/lib/circuitBreaker';
import { getMetricsSnapshot } from '@/lib/telemetry/metrics';
import { generateRequestId, requestIdHeaderName } from '@/lib/telemetry/requestId';

export async function GET() {
  const requestId = generateRequestId();
  const uptime = Math.floor(process.uptime());
  let db: 'connected' | 'disconnected' = 'disconnected';
  let postgres: 'connected' | 'disconnected' | 'not_configured' = 'not_configured';
  let queue: 'connected' | 'disconnected' | 'not_configured' = 'not_configured';
  let queueDepth = 0;

  try {
    await connectDB();
    db = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  } catch {
    db = 'disconnected';
  }

  if (process.env.DATABASE_URL) {
    postgres = (await pingPostgres()) ? 'connected' : 'disconnected';
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    try {
      const redis = new Redis({ url: redisUrl, token: redisToken });
      await redis.ping();
      queue = 'connected';
    } catch {
      queue = 'disconnected';
    }
  }

  try {
    queueDepth = await getJobQueueDepth();
  } catch {
    queueDepth = 0;
  }

  const mem = process.memoryUsage();
  const heapPct = mem.heapTotal ? (mem.heapUsed / mem.heapTotal) * 100 : 0;
  const metrics = getMetricsSnapshot(60_000);

  const healthy = db === 'connected' && !mongoCircuit.isOpen();
  const body = {
    status: healthy ? 'ok' : 'degraded',
    db: healthy ? db : 'disconnected',
    postgres,
    queue,
    queueDepth,
    uptime,
    memory: { heapPercent: Math.round(heapPct) },
    circuitBreakers: {
      mongodb: mongoCircuit.getState(),
      postgres: postgresCircuit.getState(),
    },
    alerts: metrics.alerts,
  };

  return NextResponse.json(body, {
    status: healthy ? 200 : 503,
    headers: { [requestIdHeaderName()]: requestId },
  });
}
