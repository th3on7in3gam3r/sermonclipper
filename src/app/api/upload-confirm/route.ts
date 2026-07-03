import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { deleteObjectFromR2, getR2ObjectMetadata, getR2ObjectRange, getR2ObjectUrl } from '@/lib/r2';
import { isAllowedMediaBuffer, isAudioMediaFormat, detectMediaFormat } from '@/lib/fileValidation';
import { scanUploadHash } from '@/lib/virusScan';

const SAMPLE_BYTES = 512 * 1024;

/** Validate magic bytes + optional malware scan after client PUT to R2. */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key } = await req.json();
    if (!key || typeof key !== 'string' || key.includes('..') || !key.startsWith('uploads/')) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }

    const fileName = key.split('/').pop() || key;

    let contentLength: number;
    try {
      const meta = await getR2ObjectMetadata(key);
      contentLength = meta.contentLength;
    } catch {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }

    if (contentLength <= 0) {
      return NextResponse.json({ error: 'Upload is empty' }, { status: 400 });
    }

    const rangeEnd = Math.min(contentLength - 1, SAMPLE_BYTES - 1);
    const { body } = await getR2ObjectRange(key, 0, rangeEnd);
    const sample = await body.transformToByteArray();

    if (!isAllowedMediaBuffer(sample, fileName)) {
      await deleteObjectFromR2(key).catch(() => {});
      return NextResponse.json(
        {
          error:
            'Invalid file type. Only MP4, MOV, WEBM, MP3, M4A, and AAC files are allowed.',
        },
        { status: 415 }
      );
    }

    const mediaFormat = detectMediaFormat(sample, fileName);
    const isAudio = mediaFormat ? isAudioMediaFormat(mediaFormat) : /\.(mp3|m4a|aac)$/i.test(fileName);

    const scan = await scanUploadHash(sample);
    if (!scan.clean) {
      await deleteObjectFromR2(key).catch(() => {});
      return NextResponse.json({ error: scan.message || 'File failed security scan' }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      key,
      sizeBytes: contentLength,
      internalUrl: getR2ObjectUrl(key),
      isAudio,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Validation failed';
    console.error('[Upload Confirm] Error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
