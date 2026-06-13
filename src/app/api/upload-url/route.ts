import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generatePresignedUploadUrl } from '../../../lib/r2';
import { MAX_DIRECT_UPLOAD_BYTES, MAX_DIRECT_UPLOAD_LABEL } from '@/lib/uploadLimits';
import { buildUploadKey } from '@/lib/storageKeys';
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

    const { fileName, contentType, jobId: incomingJobId, fileSizeBytes } = await req.json();
    if (!fileName) {
      return NextResponse.json({ error: 'Missing fileName' }, { status: 400 });
    }

    if (typeof fileSizeBytes === 'number') {
      if (fileSizeBytes <= 0) {
        return NextResponse.json({ error: 'Invalid file size' }, { status: 400 });
      }
      if (fileSizeBytes > MAX_DIRECT_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: `File exceeds the ${MAX_DIRECT_UPLOAD_LABEL} direct upload limit` },
          { status: 413 }
        );
      }
    }

    const jobId = incomingJobId || uuidv4();

    const extFromName = fileName.split('.').pop()?.toLowerCase();
    const ext = extFromName === 'webm' || extFromName === 'mov' ? extFromName : 'mp4';
    const key = buildUploadKey(jobId, ext);

    const contentTypeHeader =
      contentType && ['video/mp4', 'video/webm', 'video/quicktime'].includes(contentType)
        ? contentType
        : ext === 'webm'
          ? 'video/webm'
          : ext === 'mov'
            ? 'video/quicktime'
            : 'video/mp4';

    const { uploadUrl } = await generatePresignedUploadUrl(key, contentTypeHeader, 3600);

    return NextResponse.json({
      success: true,
      jobId,
      uploadUrl,
      key,
      confirmAfterUpload: true,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate upload URL';
    console.error('[Upload URL] Error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
