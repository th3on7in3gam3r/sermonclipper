import { NextRequest, NextResponse } from 'next/server';
import { uploadBufferToR2 } from '../../../lib/r2';
import { progressManager } from '../../../lib/progress';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const jobId = formData.get('jobId') as string || uuidv4();

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    progressManager.update(jobId, { 
      step: 'Uploading', 
      status: 'loading', 
      message: '[Neural Pulse] Securely uploading sermon binary to Sanctum...' 
    });

    const r2Key = `uploads/${jobId}/${file.name}`;
    const r2Url = await uploadBufferToR2(r2Key, buffer, file.type || 'video/mp4');

    progressManager.update(jobId, { 
      step: 'Uploading', 
      status: 'completed', 
      message: 'Binary Upload Complete' 
    });

    return NextResponse.json({ 
      success: true, 
      jobId,
      url: r2Url
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
