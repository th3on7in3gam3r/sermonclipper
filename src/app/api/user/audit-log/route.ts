import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserAuditLog } from '@/lib/auditLog';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const events = await getUserAuditLog(userId);
  return NextResponse.json({ events });
}
