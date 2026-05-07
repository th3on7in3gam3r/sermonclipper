import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { extname } from 'path';
import { existsSync } from 'fs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pathParam = searchParams.get('path');

    if (!pathParam) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
    }

    const filePath = decodeURIComponent(pathParam);

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileStat = await stat(filePath);
    const extension = extname(filePath).toLowerCase();
    
    // Determine Content-Type
    let contentType = 'application/octet-stream';
    if (extension === '.mp4') contentType = 'video/mp4';
    else if (extension === '.jpg' || extension === '.jpeg') contentType = 'image/jpeg';
    else if (extension === '.srt') contentType = 'text/plain';

    // For thumbnails and other assets, send full file
    if (extension !== '.mp4') {
      const file = await readFile(filePath);
      return new NextResponse(file, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileStat.size.toString(),
          'Content-Disposition': `inline`,
        },
      });
    }

    // For videos, we need to handle range requests for streaming/seeking
    // Simplified streaming for local dev
    const file = await readFile(filePath);
    return new NextResponse(file, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': fileStat.size.toString(),
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `inline`,
      },
    });
  } catch (error: unknown) {
    console.error('Download error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
