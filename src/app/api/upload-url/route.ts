import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generatePresignedUploadUrl } from '../../../lib/r2';
import { MAX_DIRECT_UPLOAD_BYTES, MAX_DIRECT_UPLOAD_LABEL } from '@/lib/uploadLimits';
import { buildUploadKey } from '@/lib/storageKeys';
import { contentTypeForFormat, type AllowedMediaFormat } from '@/lib/fileValidation';
import { v4 as uuidv4 } from 'uuid';

const AUDIO_EXTS = new Set(['mp3', 'm4a', 'aac']);
const VIDEO_EXTS = new Set(['mp4', 'mov', 'webm']);

function resolveUploadExt(fileName: string): AllowedMediaFormat {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'mp4';
  if (AUDIO_EXTS.has(ext)) return ext as AllowedMediaFormat;
  if (ext === 'webm' || ext === 'mov') return ext;
  return 'mp4';
}

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
    const ext = resolveUploadExt(fileName);
    const key = buildUploadKey(jobId, ext);

    const allowedTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'audio/mpeg',
      'audio/mp4',
      'audio/aac',
      'audio/x-m4a',
    ];
    const contentTypeHeader =
      contentType && allowedTypes.includes(contentType)
        ? contentType
        : contentTypeForFormat(ext);

    const { uploadUrl } = await generatePresignedUploadUrl(key, contentTypeHeader, 3600);

    return NextResponse.json({
      success: true,
      jobId,
      uploadUrl,
      key,
      confirmAfterUpload: true,
      isAudio: AUDIO_EXTS.has(ext),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate upload URL';
    console.error('[Upload URL] Error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
