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

// Matches all known YouTube bot/sign-in block messages
const BOT_BLOCK_REGEX =
  /Sign in to confirm|confirm you.{0,10}re not a bot|bot detection|This video is not available|members-only|age-restricted/i;

function buildBaseFlags(filePath: string, format: string): Record<string, unknown> {
  return {
    output: filePath,
    format,
    noCheckCertificate: true,
    noWarnings: true,
    // Randomise sleep between requests to mimic organic browsing
    sleepRequests: 1,
  };
}

function applyPlayerClient(
  flags: Record<string, unknown>,
  playerClient: string,
): Record<string, unknown> {
  return {
    ...flags,
    extractorArgs: `youtube:player_client=${playerClient}`,
  };
}

function applyCookies(flags: Record<string, unknown>): Record<string, unknown> {
  if (youtubeCookiePath && existsSync(youtubeCookiePath)) {
    return { ...flags, cookies: youtubeCookiePath };
  }
  if (youtubeCookiesBrowser) {
    return { ...flags, cookiesFromBrowser: youtubeCookiesBrowser };
  }
  return flags;
}

async function runYoutubeDownload(url: string, flags: Record<string, unknown>): Promise<void> {
  console.log('[Download] Running yt-dlp with flags:', JSON.stringify(flags));
  const output = await youtubeDl(url, flags as Parameters<typeof youtubeDl>[1]);
  console.log(`[Download] yt-dlp output: ${JSON.stringify(output)}`);
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

    const FORMAT_BEST = 'bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/bestvideo[ext=mp4]+bestaudio/best[ext=mp4]/best';
    const FORMAT_FALLBACK = 'best[ext=mp4]/best';

    /**
     * Multi-stage download waterfall — each stage uses a different YouTube
     * player client to avoid bot-detection without requiring cookies:
     *
     *  Stage 1: web_creator  — avoids age/bot checks on the web API path
     *  Stage 2: ios          — mobile API path, rarely blocked
     *  Stage 3: tv_embedded  — TV embed path, last cookie-free option
     *  Stage 4: cookies      — use browser/file cookies if env vars set
     */
    const stages: Array<{ label: string; flags: Record<string, unknown> }> = [
      {
        label: 'web_creator player',
        flags: applyPlayerClient(buildBaseFlags(filePath, FORMAT_BEST), 'web_creator'),
      },
      {
        label: 'ios player',
        flags: applyPlayerClient(buildBaseFlags(filePath, FORMAT_BEST), 'ios'),
      },
      {
        label: 'tv_embedded player',
        flags: applyPlayerClient(buildBaseFlags(filePath, FORMAT_FALLBACK), 'tv_embedded'),
      },
      {
        label: 'cookies fallback',
        flags: applyCookies(applyPlayerClient(buildBaseFlags(filePath, FORMAT_FALLBACK), 'web')),
      },
    ];

    let lastError: string = '';
    let succeeded = false;

    for (const stage of stages) {
      try {
        console.log(`[Download] Trying stage: ${stage.label}`);
        await runYoutubeDownload(url, stage.flags);
        console.log(`[Download] Stage succeeded: ${stage.label}`);
        succeeded = true;
        break;
      } catch (stageErr: unknown) {
        lastError = stageErr instanceof Error ? stageErr.message : String(stageErr);
        console.warn(`[Download] Stage "${stage.label}" failed: ${lastError}`);

        // If this is a non-recoverable error (e.g. private/deleted video), stop early
        if (/Video unavailable|Private video|removed by the uploader/i.test(lastError)) {
          return NextResponse.json(
            { error: `This video is unavailable or private: ${lastError}` },
            { status: 422 },
          );
        }
      }
    }

    if (!succeeded) {
      const isBotBlock = BOT_BLOCK_REGEX.test(lastError);
      const hint = isBotBlock
        ? ' Set YTDLP_COOKIES_PATH or YTDLP_COOKIES_BROWSER env vars to use browser cookies.'
        : '';
      return NextResponse.json(
        { error: `YouTube download failed after all retry attempts: ${lastError}${hint}` },
        { status: 500 },
      );
    }

    // Verify file exists or find it if yt-dlp changed the extension
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
        console.error(`[Download] No file matching ${baseName} in ${tmpDir}. Files: ${files.join(', ')}`);
        return NextResponse.json(
          { error: 'Video file was not found after download.' },
          { status: 500 },
        );
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
      const r2Msg = r2Err instanceof Error ? r2Err.message : String(r2Err);
      console.warn('[Download] R2 upload skipped:', r2Msg);
    }

    progressManager.update(jobId, {
      step: 'Uploading',
      status: 'completed',
      message: 'YouTube download complete',
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
