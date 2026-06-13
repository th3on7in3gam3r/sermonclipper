import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generatePresignedDownloadUrl } from '@/lib/r2';
import { extractR2Key, isDownloadableMasterUrl, isR2StorageUrl } from '@/lib/videoSource';

/**
 * Returns a download-ready URL for a harvested master video.
 * GET /api/master-download?url=<encoded storage url>
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rawUrl = searchParams.get('url');

    if (!rawUrl) {
      return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
    }

    if (!isDownloadableMasterUrl(rawUrl)) {
      return NextResponse.json(
        {
          error: 'No downloadable master file for this session. Upload an MP4 or wait for harvest to finish.',
        },
        { status: 400 }
      );
    }

    const filename = 'vesper-master.mp4';

    if (isR2StorageUrl(rawUrl) && !rawUrl.includes('X-Amz-Signature')) {
      const key = extractR2Key(rawUrl);
      const url = await generatePresignedDownloadUrl(key, filename);
      return NextResponse.json({ url, filename });
    }

    return NextResponse.json({ url: rawUrl, filename });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to prepare download';
    console.error('[Master Download] Error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
