import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { isAppLocale } from '@/lib/i18n/resources';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ locale: 'en' });

  await connectDB();
  const user = await User.findOne({ clerkId: userId }).lean();
  return NextResponse.json({ locale: user?.locale || 'en' });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if (!isAppLocale(body.locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }

  await connectDB();
  await User.findOneAndUpdate({ clerkId: userId }, { $set: { locale: body.locale } });
  return NextResponse.json({ ok: true, locale: body.locale });
}
