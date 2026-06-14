import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

/** Store Mailchimp API key for newsletter embed integration. */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { apiKey, serverPrefix } = await req.json();
  if (!apiKey) return NextResponse.json({ error: 'API key required' }, { status: 400 });

  await connectDB();
  await User.updateOne(
    { clerkId: userId },
    { $set: { mailchimpApiKey: apiKey, mailchimpServer: serverPrefix || apiKey.split('-').pop() } }
  );

  return NextResponse.json({ ok: true, message: 'Mailchimp connected. Paste newsletter HTML into your next campaign.' });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ clerkId: userId }).lean();
  return NextResponse.json({ connected: Boolean(user?.mailchimpApiKey) });
}
