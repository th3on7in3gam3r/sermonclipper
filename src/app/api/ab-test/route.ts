import { NextRequest, NextResponse } from 'next/server';
import { logAbTestEvent } from '@/lib/abTest';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { testName, variant, eventType, anonymousId, userId } = body;

  if (!testName || !variant || !eventType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (!['A', 'B', 'C'].includes(variant)) {
    return NextResponse.json({ error: 'Invalid variant' }, { status: 400 });
  }
  if (!['impression', 'click', 'signup'].includes(eventType)) {
    return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 });
  }

  await logAbTestEvent({ testName, variant, eventType, anonymousId, userId });
  return NextResponse.json({ ok: true });
}
