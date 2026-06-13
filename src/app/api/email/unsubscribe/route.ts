import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { SITE_TITLE } from '@/lib/siteConfig';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return new NextResponse('Missing unsubscribe token.', { status: 400 });
  }

  await connectDB();
  const user = await User.findOne({ emailUnsubscribeToken: token });
  if (!user) {
    return new NextResponse('Invalid or expired unsubscribe link.', { status: 404 });
  }

  user.emailUnsubscribed = true;
  await user.save();

  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#050508;color:#fff;padding:40px;text-align:center;">
    <h1>Unsubscribed</h1>
    <p>You will no longer receive marketing and notification emails from ${SITE_TITLE}.</p>
    <p style="color:#71717A;font-size:14px;">Account emails about billing or security may still be sent when required.</p>
  </body></html>`;

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}
