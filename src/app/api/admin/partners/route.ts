import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PartnerApplication from '@/models/PartnerApplication';
import { randomBytes } from 'crypto';

function isAdmin(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && req.headers.get('authorization') === `Bearer ${secret}`);
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const status = req.nextUrl.searchParams.get('status') || 'pending';
  const apps = await PartnerApplication.find({ status }).sort({ createdAt: -1 }).limit(100).lean();
  return NextResponse.json({ applications: apps });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, action } = await req.json();
  if (!id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  await connectDB();
  const app = await PartnerApplication.findById(id);
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'approve') {
    app.status = 'approved';
    app.affiliateCode = app.affiliateCode || `VESPER-${randomBytes(4).toString('hex').toUpperCase()}`;
    await app.save();
    return NextResponse.json({ ok: true, affiliateCode: app.affiliateCode });
  }

  app.status = 'rejected';
  await app.save();
  return NextResponse.json({ ok: true });
}
