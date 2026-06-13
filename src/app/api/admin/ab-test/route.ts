import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getAbTestStats } from '@/lib/abTest';
import { isVesperAdmin } from '@/lib/adminBypass';

export async function GET() {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  if (!userId || !isVesperAdmin(userId, clerkUser)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const heroCta = await getAbTestStats('hero_cta');
  return NextResponse.json({ heroCta });
}
