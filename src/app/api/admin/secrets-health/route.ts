import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isVesperAdmin } from '@/lib/adminBypass';
import { getSecretsHealthReport, getConfiguredSecretIds } from '@/lib/secrets/registry';

export async function GET() {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  if (!userId || !isVesperAdmin(userId, clerkUser)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const secrets = getSecretsHealthReport();
  const configured = new Set(getConfiguredSecretIds());

  return NextResponse.json({
    secrets: secrets.map((s) => ({
      ...s,
      configured: configured.has(s.id),
      hasPrevious: s.previousEnv ? Boolean(process.env[s.previousEnv]) : false,
    })),
    guidance: {
      manager: 'Use Doppler, AWS Secrets Manager, or 1Password — never commit secrets to git.',
      stripeRotation: 'Set STRIPE_WEBHOOK_SECRET_PREVIOUS during rotation; both secrets verify webhooks.',
      cronRotation: 'Set CRON_SECRET_PREVIOUS during worker secret rotation.',
      apiKeys: 'Developer keys rotate via PATCH /api/developer/keys with 7-day grace period.',
    },
  });
}
