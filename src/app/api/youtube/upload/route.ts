import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadVideo } from '@/lib/youtube';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { videoUrl, title, description, thumbnailUrl, clipIndex, hasTextOverlay, style, clipId } =
      await req.json();

    await connectDB();
    const dbUser = await User.findOne({ clerkId: userId });

    if (!dbUser?.youtubeTokens) {
      return new NextResponse('YouTube not connected', { status: 400 });
    }

    const result = await uploadVideo(dbUser.youtubeTokens, {
      title,
      description,
      url: videoUrl,
    });

    if (result.id) {
      dbUser.youtubeThumbnailTests = [
        ...(dbUser.youtubeThumbnailTests || []),
        {
          videoId: result.id,
          clipIndex: typeof clipIndex === 'number' ? clipIndex : 0,
          clipId: clipId || undefined,
          thumbnailUrl: thumbnailUrl || undefined,
          hasTextOverlay: Boolean(hasTextOverlay),
          style: style || undefined,
          ctr: 0,
          uploadedAt: new Date(),
        },
      ];
      await dbUser.save();

      if (clipId) {
        const ClipPublication = (await import('@/models/ClipPublication')).default;
        await ClipPublication.findOneAndUpdate(
          { userId, clipId, platform: 'youtube' },
          {
            $set: {
              externalId: result.id,
              postUrl: `https://youtube.com/shorts/${result.id}`,
              publishedAt: new Date(),
            },
          },
          { upsert: true }
        );
      }
    }

    return NextResponse.json({ success: true, youtubeId: result.id });
  } catch (error: unknown) {
    console.error('[YOUTUBE_UPLOAD_ERROR]', error);
    const msg = error instanceof Error ? error.message : 'Internal Error';
    return new NextResponse(msg, { status: 500 });
  }
}
