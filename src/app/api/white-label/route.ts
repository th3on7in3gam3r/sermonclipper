import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { promises as dns } from 'dns';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getDefaultWhiteLabel, WHITE_LABEL_CNAME_TARGET } from '@/lib/whiteLabel';

function requireChurchPro(plan: string) {
  return plan === 'church_pro';
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const dbUser = await User.findOne({ clerkId: userId });
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({
    plan: dbUser.plan,
    whiteLabel: { ...getDefaultWhiteLabel(), ...(dbUser.whiteLabel || {}) },
    cnameTarget: WHITE_LABEL_CNAME_TARGET,
  });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await connectDB();
  const dbUser = await User.findOne({ clerkId: userId });
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (!requireChurchPro(dbUser.plan)) {
    return NextResponse.json({ error: 'White label requires Church Pro' }, { status: 403 });
  }

  const current = { ...getDefaultWhiteLabel(), ...(dbUser.whiteLabel || {}) };
  const next = {
    ...current,
    ...(body.churchName !== undefined ? { churchName: String(body.churchName).slice(0, 80) } : {}),
    ...(body.logoUrl !== undefined ? { logoUrl: String(body.logoUrl).slice(0, 500) } : {}),
    ...(body.primaryColor !== undefined ? { primaryColor: String(body.primaryColor).slice(0, 20) } : {}),
    ...(body.customDomain !== undefined
      ? {
          customDomain: String(body.customDomain).toLowerCase().trim(),
          customDomainVerified: false,
          customDomainVerifiedAt: undefined,
        }
      : {}),
    ...(body.emailDomain !== undefined
      ? {
          emailDomain: String(body.emailDomain).toLowerCase().trim(),
          emailDomainVerified: false,
        }
      : {}),
    ...(body.emailReplyTo !== undefined ? { emailReplyTo: String(body.emailReplyTo).slice(0, 120) } : {}),
    ...(body.showPoweredBy !== undefined ? { showPoweredBy: Boolean(body.showPoweredBy) } : {}),
  };

  dbUser.whiteLabel = next;
  await dbUser.save();

  return NextResponse.json({ whiteLabel: next, cnameTarget: WHITE_LABEL_CNAME_TARGET });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await req.json();
  await connectDB();
  const dbUser = await User.findOne({ clerkId: userId });
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (!requireChurchPro(dbUser.plan)) {
    return NextResponse.json({ error: 'White label requires Church Pro' }, { status: 403 });
  }

  const wl = { ...getDefaultWhiteLabel(), ...(dbUser.whiteLabel || {}) };

  if (action === 'verify-domain') {
    const domain = wl.customDomain;
    if (!domain) return NextResponse.json({ error: 'Enter a custom domain first' }, { status: 400 });

    try {
      const records = await dns.resolveCname(domain);
      const ok = records.some((r) => r.toLowerCase().replace(/\.$/, '') === WHITE_LABEL_CNAME_TARGET.toLowerCase());
      if (!ok) {
        return NextResponse.json({
          verified: false,
          message: `CNAME must point to ${WHITE_LABEL_CNAME_TARGET}. Found: ${records.join(', ') || 'none'}`,
        });
      }
      wl.customDomainVerified = true;
      wl.customDomainVerifiedAt = new Date();
      dbUser.whiteLabel = wl;
      await dbUser.save();
      return NextResponse.json({
        verified: true,
        message: 'Domain verified. TLS provisioning may take up to 24 hours after DNS propagates.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'DNS lookup failed';
      return NextResponse.json({ verified: false, message: msg });
    }
  }

  if (action === 'verify-email') {
    const domain = wl.emailDomain;
    if (!domain) return NextResponse.json({ error: 'Enter an email domain first' }, { status: 400 });

    try {
      const txtRecords = await dns.resolveTxt(domain);
      const flat = txtRecords.map((r) => r.join('')).join(' ');
      const hasSpf = flat.toLowerCase().includes('v=spf1');
      const hasDkim = flat.toLowerCase().includes('dkim') || flat.toLowerCase().includes('resend');
      if (!hasSpf) {
        return NextResponse.json({
          verified: false,
          message: 'SPF record not found. Add the SPF TXT record from your email provider.',
        });
      }
      wl.emailDomainVerified = hasSpf && hasDkim;
      dbUser.whiteLabel = wl;
      await dbUser.save();
      return NextResponse.json({
        verified: wl.emailDomainVerified,
        message: wl.emailDomainVerified
          ? 'Email domain verified. Transactional email will send from your domain.'
          : 'SPF found. Add DKIM records from Resend, then verify again.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'DNS lookup failed';
      return NextResponse.json({ verified: false, message: msg });
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
