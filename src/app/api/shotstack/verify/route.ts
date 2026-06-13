import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isVesperAdmin } from '@/lib/adminBypass';
import { getShotstackConfig, probeShotstackRender, verifyShotstackKey } from '@/lib/shotstack';

/** Admin-only: verify which Shotstack key/endpoint the server is using. */
export async function GET() {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  if (!userId || !isVesperAdmin(userId, clerkUser)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = getShotstackConfig();
  if (!config) {
    return NextResponse.json({
      configured: false,
      message: 'No Shotstack keys found. Set SHOTSTACK_PRODUCTION_KEY and/or SHOTSTACK_SANDBOX_KEY.',
    });
  }

  const check = await verifyShotstackKey(config.apiKey, config.renderUrl);
  const renderProbe = check.ok ? await probeShotstackRender(config.apiKey, config.renderUrl) : null;

  return NextResponse.json({
    configured: true,
    environment: config.environment,
    renderUrl: config.renderUrl,
    keyLength: config.apiKey.length,
    keyValid: check.ok,
    httpStatus: check.status,
    message: check.message,
    renderProbe: renderProbe
      ? {
          ok: renderProbe.ok,
          status: renderProbe.status,
          message: renderProbe.message,
          renderId: renderProbe.renderId,
        }
      : null,
    hint: check.ok
      ? renderProbe?.ok
        ? 'Key is valid and can queue renders.'
        : 'Key auth works but a test render failed — check Shotstack billing/credits or account status.'
      : 'Copy fresh keys from Shotstack Dashboard → API Keys. Production key → SHOTSTACK_PRODUCTION_KEY on Vercel. Sandbox key → SHOTSTACK_SANDBOX_KEY. Redeploy after updating env vars.',
  });
}
