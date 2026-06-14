import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authenticateApiKey } from '@/lib/apiKeys';
import { checkV1ApiRateLimit } from '@/lib/apiRateLimit';
import { effectivePlan } from '@/lib/adminBypass';
import { PLAN_LIMITS, getUsageResetDate } from '@/lib/plans';

export type ApiContext = {
  userId: string;
  keyId: string;
  mode: 'live' | 'test';
  plan: string;
  email?: string;
  usageCount: number;
  usageLimit: number;
  usageResetAt: Date;
};

function extractBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

export async function authenticateV1Request(req: NextRequest): Promise<
  | { ok: true; ctx: ApiContext }
  | { ok: false; response: NextResponse }
> {
  const token = extractBearerToken(req);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Missing API key. Pass Authorization: Bearer vsp_live_...' },
        { status: 401 }
      ),
    };
  }

  const auth = await authenticateApiKey(token);
  if (!auth) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid or revoked API key.' }, { status: 401 }),
    };
  }

  const limit = await checkV1ApiRateLimit(auth.keyId, auth.userId);
  if (!limit.success) {
    const res = NextResponse.json({ error: 'Rate limit exceeded.', code: 'RATE_LIMIT' }, { status: 429 });
    if (limit.retryAfterSec) res.headers.set('Retry-After', String(limit.retryAfterSec));
    return { ok: false, response: res };
  }

  await connectDB();
  const user = await User.findOne({ clerkId: auth.userId }).lean();
  const plan = effectivePlan(user?.plan, auth.userId, null);

  return {
    ok: true,
    ctx: {
      userId: auth.userId,
      keyId: auth.keyId,
      mode: auth.mode,
      plan,
      email: user?.email,
      usageCount: user?.usageCount ?? 0,
      usageLimit: PLAN_LIMITS[plan] ?? PLAN_LIMITS.free,
      usageResetAt: getUsageResetDate(user?.lastUsageReset),
    },
  };
}

export function v1Json(data: Record<string, unknown>, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function v1Error(message: string, status = 400, code?: string) {
  return NextResponse.json({ ok: false, error: message, ...(code ? { code } : {}) }, { status });
}
