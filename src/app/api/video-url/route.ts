import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedGetUrl } from '../../../lib/r2';

/**
 * Returns a short-lived presigned GET URL for a private R2 object.
 * Used by the results page so the browser can play back uploaded videos.
 *
 * GET /api/video-url?key=uploads/jobId/file.mp4
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUrl = searchParams.get('url');

    if (!rawUrl) {
      return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
    }

    // If it's already a presigned URL or not an R2 private URL, return as-is
    if (!rawUrl.includes('.r2.cloudflarestorage.com') || rawUrl.includes('X-Amz-Signature')) {
      return NextResponse.json({ url: rawUrl });
    }

    // Extract the key from the R2 URL
    // Format: https://account.r2.cloudflarestorage.com/bucket/key
    const urlObj = new URL(rawUrl);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    // pathParts[0] = bucket, rest = key
    const key = pathParts.slice(1).map(decodeURIComponent).join('/');

    const presignedUrl = await generatePresignedGetUrl(key, 3600);
    return NextResponse.json({ url: presignedUrl });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate URL';
    console.error('[Video URL] Error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
