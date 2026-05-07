import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';

const execAsync = promisify(exec);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    const clipsDir = join(process.cwd(), 'tmp', 'clips', jobId);
    const zipPath = join(process.cwd(), 'tmp', `Vesper_Media_Kit_${jobId}.zip`);

    if (!existsSync(clipsDir)) {
      return NextResponse.json({ error: 'Media kit not found' }, { status: 404 });
    }

    // Create ZIP using system zip command (highly reliable on Mac)
    // -j jumps to the folder so we don't have full path inside zip
    await execAsync(`zip -j "${zipPath}" "${clipsDir}"/*`);

    if (!existsSync(zipPath)) {
      throw new Error('ZIP generation failed');
    }

    const fileStat = await stat(zipPath);
    const file = createReadStream(zipPath);
    
    // Convert Node.js stream to Web stream
    const stream = new ReadableStream({
      start(controller) {
        file.on('data', (chunk) => controller.enqueue(chunk));
        file.on('end', () => controller.close());
        file.on('error', (err) => controller.error(err));
      },
      cancel() {
        file.destroy();
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="Vesper_Media_Kit_${jobId.slice(0, 8)}.zip"`,
        'Content-Length': fileStat.size.toString(),
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
