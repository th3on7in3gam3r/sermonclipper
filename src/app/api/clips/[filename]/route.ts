import { NextRequest, NextResponse } from 'next/server';
import { stat, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync, createReadStream } from 'fs';

// Helper to find file in jobId subdirectories
async function findClipPath(filename: string) {
  const clipsBase = join(process.cwd(), 'tmp', 'clips');
  if (!existsSync(clipsBase)) return null;
  
  const jobDirs = await readdir(clipsBase);
  for (const jobDir of jobDirs) {
    const fullPath = join(clipsBase, jobDir, filename);
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
    const filePath = await findClipPath(filename);

    if (!filePath) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    const fileStat = await stat(filePath);
    const fileSize = fileStat.size;
    const range = req.headers.get('range');
    console.log(`[DEBUG] Serving: ${filename} | Range: ${range || 'None'}`);

    // Determine Content-Type based on extension
    const isVideo = filename.endsWith('.mp4');
    const contentType = isVideo ? 'video/mp4' : 'image/jpeg';

    if (range && isVideo) {
      // --- HARDENED RANGE REQUEST STREAMING ---
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      console.log(`[DEBUG] Streaming Range: ${start}-${end} / ${fileSize}`);

      if (start >= fileSize) {
        console.error(`[DEBUG] Invalid Range Request: Start ${start} >= FileSize ${fileSize}`);
        return new Response('Requested range not satisfiable', {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` }
        });
      }

      const file = createReadStream(filePath, { start, end });
      const stream = new ReadableStream({
        start(controller) {
          file.on('data', (chunk) => {
            if (typeof chunk !== 'string') {
              controller.enqueue(new Uint8Array(chunk));
            }
          });
          file.on('end', () => controller.close());
          file.on('error', (err) => controller.error(err));
        },
        cancel() {
          file.destroy();
        }
      });

      return new Response(stream, {
        status: 206,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': (end - start + 1).toString(),
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-cache',
        },
      });
    } else {
      // --- STANDARD STREAMING ---
      const file = createReadStream(filePath);
      const stream = new ReadableStream({
        start(controller) {
          file.on('data', (chunk) => {
            if (typeof chunk !== 'string') {
              controller.enqueue(new Uint8Array(chunk));
            }
          });
          file.on('end', () => controller.close());
          file.on('error', (err) => controller.error(err));
        },
        cancel() {
          file.destroy();
        }
      });
      
      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileSize.toString(),
          'Accept-Ranges': 'bytes',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': isVideo ? 'public, max-age=3600' : 'no-cache',
        },
      });
    }
  } catch (error: unknown) {
    console.error('Clip serving error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
