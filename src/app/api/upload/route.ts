export const bodyParser = {
  sizeLimit: '100mb',
};

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { progressManager } from '@/lib/progress';
import { uploadBufferToR2 } from '@/lib/r2';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const jobId = formData.get('jobId') as string || uuidv4();

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const tmpDir = join(process.cwd(), 'tmp');
    await mkdir(tmpDir, { recursive: true });

    const fileName = `${uuidv4()}-${file.name}`;
    const filePath = join(tmpDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    progressManager.update(jobId, { 
      step: 'Uploading', 
      status: 'loading', 
      message: 'Saving file to temporary storage...' 
    });

    await writeFile(filePath, buffer);

    let r2Key: string | undefined;
    let r2Url: string | undefined;

    try {
      r2Key = `uploads/${jobId}/${file.name}`;
      r2Url = await uploadBufferToR2(r2Key, buffer, file.type || 'application/octet-stream');
      console.log('[Upload] Saved source file to R2:', r2Key);
    } catch (r2Err: unknown) {
      const msg = r2Err instanceof Error ? r2Err.message : String(r2Err);
      console.warn('[Upload] R2 upload skipped:', msg);
    }

    progressManager.update(jobId, { 
      step: 'Uploading', 
      status: 'completed', 
      message: 'Upload complete' 
    });

    return NextResponse.json({ 
      success: true, 
      filePath, 
      fileName: file.name,
      jobId,
      r2Key,
      r2Url,
    });
  } catch (error: unknown) {
    console.error('Upload error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
