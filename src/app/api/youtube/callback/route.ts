import { NextRequest, NextResponse } from 'next/server';
import { getTokens } from '@/lib/youtube';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Clerk userId or similar

  if (!code) return new NextResponse('Missing code', { status: 400 });

  try {
    const tokens = await getTokens(code);
    
    if (state) {
      await connectDB();
      await User.findOneAndUpdate(
        { clerkId: state },
        { youtubeTokens: tokens }
      );
    }
    
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?youtube=success`);
  } catch (error) {
    console.error('[YOUTUBE_CALLBACK_ERROR]', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?youtube=error`);
  }
}
