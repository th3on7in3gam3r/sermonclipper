import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { Redis } from '@upstash/redis';

export async function GET() {
  const uptime = Math.floor(process.uptime());
  let db: 'connected' | 'disconnected' = 'disconnected';
  let queue: 'connected' | 'disconnected' | 'not_configured' = 'not_configured';

  try {
    await connectDB();
    db = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  } catch {
    db = 'disconnected';
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

  const healthy = db === 'connected';
  const body = { status: healthy ? 'ok' : 'degraded', db, queue, uptime };

  return NextResponse.json(body, { status: healthy ? 200 : 503 });
}
