import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/** Planning Center OAuth — stub until API credentials are configured. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.PLANNING_CENTER_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({
      configured: false,
      message: 'Planning Center integration coming soon. Set PLANNING_CENTER_CLIENT_ID to enable.',
      docs: 'https://developer.planning.center/docs',
    });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vesper.biblefunland.com'}/api/planning-center/callback`;
  const url = `https://api.planningcenteronline.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=services`;

  return NextResponse.json({ configured: true, url });
}
