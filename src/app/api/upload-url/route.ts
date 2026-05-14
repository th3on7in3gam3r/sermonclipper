import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generatePresignedUploadUrl } from '../../../lib/r2';
import { v4 as uuidv4 } from 'uuid';

/**
 * Returns a presigned URL for direct browser-to-R2 upload.
 * Bypasses the Next.js/Koyeb body size limits entirely.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, contentType, jobId: incomingJobId } = await req.json();
    if (!fileName) {
      return NextResponse.json({ error: 'Missing fileName' }, { status: 400 });
    }

    const jobId = incomingJobId || uuidv4();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `uploads/${jobId}/${safeName}`;

    const { uploadUrl, publicUrl } = await generatePresignedUploadUrl(
      key,
      contentType || 'video/mp4',
      3600 // 1 hour expiry
    );

    return NextResponse.json({
      success: true,
      jobId,
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate upload URL';
    console.error('[Upload URL] Error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
