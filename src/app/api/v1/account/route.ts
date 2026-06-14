import { NextRequest } from 'next/server';
import { authenticateV1Request, v1Json } from '@/lib/apiAuth';

/** GET /api/v1/account — plan, quota, and account metadata */
export async function GET(req: NextRequest) {
  const auth = await authenticateV1Request(req);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  return v1Json({
    account: {
      plan: ctx.plan,
      email: ctx.email,
      quota: {
        used: ctx.usageCount,
        limit: ctx.usageLimit,
        resetAt: ctx.usageResetAt.toISOString(),
      },
      apiKeyMode: ctx.mode,
    },
  });
}
