import { NextRequest } from 'next/server';
import { authenticateV1Request, v1Json } from '@/lib/apiAuth';
import { listClipsForUser } from '@/lib/api/v1/clips';
import { withTelemetry } from '@/lib/telemetry/apiHandler';

/** GET /api/v1/clips — list clips for authenticated account */
async function getHandler(req: NextRequest) {
  const auth = await authenticateV1Request(req);
  if (!auth.ok) return auth.response;

  const sourceId = req.nextUrl.searchParams.get('sourceId') || undefined;
  const clips = await listClipsForUser(auth.ctx.userId, sourceId);

  return v1Json({ clips, count: clips.length });
}

export const GET = withTelemetry(getHandler, 'GET /api/v1/clips');
