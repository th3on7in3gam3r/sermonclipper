import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getEnabledFlagsForUser } from '@/lib/featureFlags';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ flags: {} });
  }

  const flags = await getEnabledFlagsForUser(userId);
  return NextResponse.json({ flags });
}
