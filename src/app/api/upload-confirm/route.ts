import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getObjectFromR2, deleteObjectFromR2 } from '@/lib/r2';
import { isAllowedMediaBuffer, isAudioMediaFormat, detectMediaFormat } from '@/lib/fileValidation';
import { scanUploadHash } from '@/lib/virusScan';

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

    const body = await getObjectFromR2(key);
    if (!body) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }

    const bytes = await body.transformToByteArray();
    const sample = bytes.slice(0, Math.min(bytes.length, 512 * 1024));

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

    const { getR2ObjectUrl } = await import('@/lib/r2');
    return NextResponse.json({
      success: true,
      key,
      sizeBytes: bytes.length,
      internalUrl: getR2ObjectUrl(key),
      isAudio,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Validation failed';
    console.error('[Upload Confirm] Error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
