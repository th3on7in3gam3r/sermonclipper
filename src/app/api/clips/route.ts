import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const clipsDir = join('/tmp', 'clips', jobId);
    
    try {
      const metadataPath = join(clipsDir, 'metadata.json');
      const metadataBuffer = await readFile(metadataPath);
      const data = JSON.parse(metadataBuffer.toString());
      
      // Return everything stored in metadata
      return NextResponse.json({ 
        success: true, 
        clips: data.clips || [],
        sermon_images: data.sermon_images || [],
        quotes_and_verses: data.quotes_and_verses || [],
        five_day_devotional: data.five_day_devotional || [],
        summaries: data.summaries || null,
        main_theme: data.main_theme || '',
        tone: data.tone || '',
        social_captions: data.social_captions || []
      });
    } catch {
      return NextResponse.json({ success: true, clips: [] });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
