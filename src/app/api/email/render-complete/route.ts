import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendRenderCompleteEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clipTitle, resultsUrl, thumbnailUrl } = await req.json();
  if (!clipTitle || !resultsUrl) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  await connectDB();
  const dbUser = await User.findOne({ clerkId: userId });
  if (!dbUser || dbUser.emailUnsubscribed) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
  if (!email) return NextResponse.json({ ok: true, skipped: true });

  await sendRenderCompleteEmail(
    email,
    { clipTitle, resultsUrl, thumbnailUrl },
    dbUser.emailUnsubscribeToken
  );

  return NextResponse.json({ ok: true });
}
