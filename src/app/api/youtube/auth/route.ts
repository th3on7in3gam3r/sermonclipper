import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/youtube';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  // Pass userId in state so we know who it is in the callback
  const url = getAuthUrl(userId);
  return NextResponse.json({ url });
}
