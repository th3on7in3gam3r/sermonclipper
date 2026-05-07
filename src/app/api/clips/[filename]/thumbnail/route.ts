import { NextRequest, NextResponse } from 'next/server';
import { stat, readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Helper to find file in jobId subdirectories
async function findThumbnailPath(filename: string) {
  const thumbName = filename.replace('.mp4', '.jpg');
  const clipsBase = join(process.cwd(), 'tmp', 'clips');
  if (!existsSync(clipsBase)) return null;
  
  const jobDirs = await readdir(clipsBase);
  for (const jobDir of jobDirs) {
    const fullPath = join(clipsBase, jobDir, thumbName);
    if (existsSync(fullPath)) return fullPath;
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const filePath = await findThumbnailPath(filename);

    if (!filePath) {
      return NextResponse.json({ error: 'Thumbnail not found' }, { status: 404 });
    }

    const fileStat = await stat(filePath);
    const fileBuffer = await readFile(filePath);
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': fileStat.size.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: unknown) {
    console.error('Thumbnail serving error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
