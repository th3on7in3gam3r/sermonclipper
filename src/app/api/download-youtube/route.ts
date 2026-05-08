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
const youtubeCookiePath = process.env.YTDLP_COOKIES_PATH;
const youtubeCookiesBrowser = process.env.YTDLP_COOKIES_BROWSER;

function buildYoutubeFlags(filePath: string, format: string) {
  const flags: Record<string, unknown> = {
    output: filePath,
    format,
    noCheckCertificate: true,
    noWarnings: true,
    addHeader: 'User-Agent:Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  };

  if (youtubeCookiePath && existsSync(youtubeCookiePath)) {
    flags.cookies = youtubeCookiePath;
  } else if (youtubeCookiesBrowser) {
    flags.cookiesFromBrowser = youtubeCookiesBrowser;
  }

  return flags as Parameters<typeof youtubeDl>[1];
}

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
      message: 'Downloading video from YouTube...',
    });

    async function runYoutubeDownload(flags: Parameters<typeof youtubeDl>[1]) {
      console.log('[Download] Running yt-dlp with flags:', flags);
      const output = await youtubeDl(url, flags);
      console.log(`[Download] yt-dlp stdout: ${JSON.stringify(output)}`);
    }

    try {
      await runYoutubeDownload(buildYoutubeFlags(filePath, 'bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/bestvideo[ext=mp4]+bestaudio/best[ext=mp4]/best'));
    } catch (dlErr: unknown) {
      const msg = dlErr instanceof Error ? dlErr.message : String(dlErr);
      console.error('[Download] yt-dlp error:', dlErr);

      const botBlockError = /Sign in to confirm you(’|')re not a bot|Sign in to confirm you're not a bot/.test(msg);
      const cookiesEnabled = youtubeCookiePath || youtubeCookiesBrowser;

      if (botBlockError && !cookiesEnabled) {
        return NextResponse.json({
          error: 'YouTube blocked the download as a bot. Provide YTDLP_COOKIES_PATH or YTDLP_COOKIES_BROWSER in environment variables to retry with browser cookies.',
        }, { status: 500 });
      }

      try {
        console.log('[Download] Retrying with gentler flags and cookie support if available...');
        await runYoutubeDownload(buildYoutubeFlags(filePath, 'best[ext=mp4]/best'));
      } catch (retryErr: unknown) {
        const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
        console.error('[Download] Retry also failed:', retryErr);
        return NextResponse.json({ error: `YouTube download failed: ${retryMsg}` }, { status: 500 });
      }
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
    } catch (r2Err: unknown) {
      const msg = r2Err instanceof Error ? r2Err.message : String(r2Err);
      console.warn('[Download] R2 upload skipped:', msg);
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
  } catch (error: unknown) {
    console.error('[Download] Critical error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
