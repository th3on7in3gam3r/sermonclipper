import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextRequest } from 'next/server';

export const RATE_LIMIT_MESSAGE = "You're moving fast! Please wait a moment before trying again.";

type LimitResult = { success: boolean; retryAfterSec?: number };

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, limit: number, windowMs: number): LimitResult {
  const now = Date.now();
  const entry = memoryBuckets.get(key);
  if (!entry || now >= entry.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }
  if (entry.count >= limit) {
    return { success: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { success: true };
}

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function buildLimiter(requests: number, window: `${number} ${'s' | 'm' | 'h' | 'd'}`) {
  const redis = getRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: false,
  });
}

const uploadLimiter = buildLimiter(5, '1 h');
const youtubeLimiter = buildLimiter(10, '1 h');
const generalLimiter = buildLimiter(100, '1 m');
const authIpLimiter = buildLimiter(10, '15 m');

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  );
}

async function runLimit(
  limiter: Ratelimit | null,
  key: string,
  fallbackLimit: number,
  fallbackWindowMs: number
): Promise<LimitResult> {
  if (limiter) {
    const result = await limiter.limit(key);
    if (!result.success) {
      return { success: false, retryAfterSec: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)) };
    }
    return { success: true };
  }
  return memoryLimit(key, fallbackLimit, fallbackWindowMs);
}

export async function checkApiRateLimit(req: NextRequest, userId?: string | null): Promise<LimitResult> {
  try {
    const path = req.nextUrl.pathname;
    const ip = clientIp(req);

    if (path.startsWith('/sign-in') || path.startsWith('/sign-up') || path.includes('clerk')) {
      return runLimit(authIpLimiter, `auth:${ip}`, 10, 15 * 60 * 1000);
    }

    if (path === '/api/upload-url' || path === '/api/upload' || path === '/api/upload-confirm') {
      const key = userId ? `upload:${userId}` : `upload:ip:${ip}`;
      return runLimit(uploadLimiter, key, 5, 60 * 60 * 1000);
    }

    if (path === '/api/download-youtube' || path === '/api/youtube/validate') {
      const key = userId ? `yt:${userId}` : `yt:ip:${ip}`;
      return runLimit(youtubeLimiter, key, 10, 60 * 60 * 1000);
    }

    if (path.startsWith('/api/')) {
      const key = userId ? `api:${userId}` : `api:ip:${ip}`;
      return runLimit(generalLimiter, key, 100, 60 * 1000);
    }

    return { success: true };
  } catch (err) {
    console.warn('[RateLimit] Check failed — allowing request:', err);
    return { success: true };
  }
}
