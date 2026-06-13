import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { randomBytes } from 'crypto';
import connectDB from '@/lib/mongodb';
import { Webhook, WebhookDelivery } from '@/models/Webhook';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const webhooks = await Webhook.find({ userId }).lean();
  const deliveries = await WebhookDelivery.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();
  return NextResponse.json({ webhooks, deliveries });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { url, events } = await req.json();
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Missing webhook URL' }, { status: 400 });
  }

  await connectDB();
  const webhook = await Webhook.create({
    userId,
    url,
    secret: randomBytes(16).toString('hex'),
    events: events || ['clip.created', 'clip.exported', 'quota.warning'],
  });

  return NextResponse.json({ webhook });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await connectDB();
  await Webhook.deleteOne({ _id: id, userId });
  return NextResponse.json({ success: true });
}
