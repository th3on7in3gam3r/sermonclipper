import { NextRequest } from 'next/server';
import { authenticateV1Request, v1Json } from '@/lib/apiAuth';
import { listClipsForUser } from '@/lib/api/v1/clips';

/** GET /api/v1/clips — list clips for authenticated account */
export async function GET(req: NextRequest) {
  const auth = await authenticateV1Request(req);
  if (!auth.ok) return auth.response;

  const sourceId = req.nextUrl.searchParams.get('sourceId') || undefined;
  const clips = await listClipsForUser(auth.ctx.userId, sourceId);

  return v1Json({ clips, count: clips.length });
}
