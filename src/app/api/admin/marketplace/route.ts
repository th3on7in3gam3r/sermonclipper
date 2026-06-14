import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import MarketplaceTemplate from '@/models/MarketplaceTemplate';

/** Admin/manual curation — requires VESPER_ADMIN_IDS env. */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const admins = (process.env.VESPER_ADMIN_IDS || '').split(',').filter(Boolean);
  if (!userId || !admins.includes(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { templateId, action } = await req.json();
  if (!templateId || !['approve', 'reject', 'feature'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  await connectDB();
  if (action === 'approve') {
    await MarketplaceTemplate.updateOne(
      { _id: templateId },
      { $set: { status: 'approved', approvedAt: new Date() } }
    );
  } else if (action === 'reject') {
    await MarketplaceTemplate.updateOne({ _id: templateId }, { $set: { status: 'rejected' } });
  } else {
    await MarketplaceTemplate.updateOne({ _id: templateId }, { $set: { featured: true } });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const { userId } = await auth();
  const admins = (process.env.VESPER_ADMIN_IDS || '').split(',').filter(Boolean);
  if (!userId || !admins.includes(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const pending = await MarketplaceTemplate.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ pending });
}
