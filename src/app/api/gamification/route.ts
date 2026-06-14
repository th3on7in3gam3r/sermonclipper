import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getGamificationSummary } from '@/lib/gamification';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const summary = await getGamificationSummary(userId);
  return NextResponse.json(summary);
}
