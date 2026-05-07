import { NextRequest, NextResponse } from 'next/server';
import { create } from 'yt-dlp-exec';
import { v4 as uuidv4 } from 'uuid';
import { join, basename } from 'path';
import { mkdir, readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { progressManager } from '@/lib/progress';
import { uploadBufferToR2 } from '@/lib/r2';

const binPath = join(process.cwd(), 'node_modules', 'yt-dlp-exec', 'bin', 'yt-dlp');
const youtubeDl = create(binPath);

export async function POST(req: NextRequest) {
  try {
    const { url, jobId = uuidv4() } = await req.json();
    console.log(`[Download] Starting download for jobId: ${jobId}, URL: ${url}`);

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    const tmpDir = join(process.cwd(), 'tmp');
    await mkdir(tmpDir, { recursive: true });

    const fileName = `${uuidv4()}.mp4`;
    const filePath = join(tmpDir, fileName);
    console.log(`[Download] Target filePath: ${filePath}`);

    progressManager.update(jobId, { 
      step: 'Uploading', 
      status: 'loading', 
      message: 'Downloading video from YouTube...' 
    });

    try {
      console.log('[Download] Running yt-dlp...');
      const output = await youtubeDl(url, {
        output: filePath,
        format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        noCheckCertificate: true,
        noWarnings: true,
        preferFreeFormats: true,
        userAgent: 'googlebot',
        referer: 'https://www.youtube.com',
      });
      console.log(`[Download] yt-dlp stdout: ${JSON.stringify(output)}`);
    } catch (dlErr: any) {
      console.error('[Download] yt-dlp error:', dlErr);
      return NextResponse.json({ error: `YouTube download failed: ${dlErr.message}` }, { status: 500 });
    }

    // Verify file exists or find it if extension changed
    let finalPath = filePath;
    if (!existsSync(filePath)) {
      console.log(`[Download] File not found at ${filePath}. Scanning directory...`);
      const files = await readdir(tmpDir);
      const baseName = fileName.replace('.mp4', '');
      const foundFile = files.find(f => f.startsWith(baseName));
      
      if (foundFile) {
        finalPath = join(tmpDir, foundFile);
        console.log(`[Download] Found file with different extension: ${finalPath}`);
      } else {
        console.error(`[Download] Error: No file matching ${baseName} found in ${tmpDir}. Files: ${files.join(', ')}`);
        return NextResponse.json({ 
          error: `Video file was not found after download.` 
        }, { status: 500 });
      }
    }

    console.log(`[Download] Final verified path: ${finalPath}`);

    let r2Key: string | undefined;
    let r2Url: string | undefined;

    try {
      const videoBuffer = await readFile(finalPath);
      const remoteName = basename(finalPath);
      r2Key = `downloads/${jobId}/${remoteName}`;
      r2Url = await uploadBufferToR2(r2Key, videoBuffer, 'video/mp4');
      console.log('[Download] Saved downloaded video to R2:', r2Key);
    } catch (r2Err: any) {
      console.warn('[Download] R2 upload skipped:', r2Err.message);
    }

    progressManager.update(jobId, { 
      step: 'Uploading', 
      status: 'completed', 
      message: 'YouTube download complete' 
    });

    return NextResponse.json({ 
      success: true, 
      filePath: finalPath, 
      jobId,
      r2Key,
      r2Url,
    });
  } catch (error: any) {
    console.error('[Download] Critical error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
