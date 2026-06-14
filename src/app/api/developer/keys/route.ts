import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createApiKey, listApiKeys, revokeApiKey, rotateApiKey } from '@/lib/apiKeys';

/** GET /api/developer/keys — list API keys (Clerk session) */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const keys = await listApiKeys(userId);
  return NextResponse.json({ keys });
}

/** POST /api/developer/keys — create API key (shown once) */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name : 'Default';
  const mode = body.mode === 'test' ? 'test' : 'live';

  const created = await createApiKey(userId, { name, mode });
  return NextResponse.json({
    key: created.key,
    id: created.id,
    prefix: created.prefix,
    last4: created.last4,
    mode: created.mode,
    name: created.name,
    warning: 'Store this key securely — it will not be shown again.',
  });
}

/** DELETE /api/developer/keys?id=... */
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const ok = await revokeApiKey(userId, id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ revoked: true });
}

/** PATCH /api/developer/keys — rotate key (7-day grace on old key) */
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const rotated = await rotateApiKey(userId, id);
  if (!rotated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    key: rotated.key,
    id: rotated.id,
    warning: 'Old key remains valid for 7 days. Store the new key securely.',
  });
}
