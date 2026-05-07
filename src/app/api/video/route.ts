import { NextRequest, NextResponse } from 'next/server';
import { stat, readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');

    if (!filePath || !existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileStat = await stat(filePath);
    const fileSize = fileStat.size;
    const range = req.headers.get('range');

    // Support streaming for both MP4 and JPG
    const isVideo = filePath.endsWith('.mp4');
    const contentType = isVideo ? 'video/mp4' : 'image/jpeg';

    if (range && isVideo) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      const fileBuffer = await readFile(filePath);
      
      return new NextResponse(fileBuffer.subarray(start, end + 1), {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
        },
      });
    } else {
      const fileBuffer = await readFile(filePath);
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileSize.toString(),
          'Accept-Ranges': 'bytes',
          'Cache-Control': isVideo ? 'public, max-age=3600' : 'no-cache',
        },
      });
    }
  } catch (error: any) {
    console.error('Video serving error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
