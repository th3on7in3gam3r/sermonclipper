import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getClipAnalytics } from '@/lib/analytics/queries';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ clipId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clipId } = await context.params;
  const decoded = decodeURIComponent(clipId);
  if (!decoded.includes(':')) {
    return NextResponse.json({ error: 'Invalid clip id' }, { status: 400 });
  }

  const data = await getClipAnalytics(userId, decoded);
  return NextResponse.json(data);
}
