import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadVideo } from '@/lib/youtube';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { videoUrl, title, description } = await req.json();

    await connectDB();
    const dbUser = await User.findOne({ clerkId: userId });

    if (!dbUser?.youtubeTokens) {
      return new NextResponse('YouTube not connected', { status: 400 });
    }

    const result = await uploadVideo(dbUser.youtubeTokens, {
      title,
      description,
      url: videoUrl
    });

    return NextResponse.json({ success: true, youtubeId: result.id });
  } catch (error: any) {
    console.error('[YOUTUBE_UPLOAD_ERROR]', error);
    return new NextResponse(error.message || 'Internal Error', { status: 500 });
  }
}
