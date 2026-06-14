import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { effectivePlan } from '@/lib/adminBypass';

type LimitResult = { success: boolean; retryAfterSec?: number };

const buckets = new Map<string, { count: number; resetAt: number }>();

const LIMITS: Record<string, number> = {
  free: 60,
  creator: 300,
  church_pro: 0, // 0 = unlimited
  network: 0,
};

function memoryLimit(key: string, limit: number, windowMs: number): LimitResult {
  if (limit === 0) return { success: true };
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }
  if (entry.count >= limit) {
    return { success: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { success: true };
}

export async function checkV1ApiRateLimit(keyId: string, userId: string): Promise<LimitResult> {
  await connectDB();
  const user = await User.findOne({ clerkId: userId }).lean();
  const plan = effectivePlan(user?.plan, userId, null);
  const limit = LIMITS[plan] ?? LIMITS.free;
  return memoryLimit(`v1:${keyId}`, limit, 60_000);
}
