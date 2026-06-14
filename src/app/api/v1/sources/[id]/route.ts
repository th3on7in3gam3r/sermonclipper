import { NextRequest } from 'next/server';
import { authenticateV1Request, v1Error, v1Json } from '@/lib/apiAuth';
import { getSourceForUser } from '@/lib/api/v1/clips';

/** GET /api/v1/sources/:id — processing status */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateV1Request(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const source = await getSourceForUser(auth.ctx.userId, id);
  if (!source) return v1Error('Source not found', 404);

  return v1Json({ source });
}
