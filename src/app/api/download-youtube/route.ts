import { NextRequest, NextResponse } from 'next/server';
import { create } from 'yt-dlp-exec';
import { v4 as uuidv4 } from 'uuid';
import { join, basename } from 'path';
import { mkdir, readdir, readFile } from 'fs/promises';
import { existsSync, createWriteStream, writeFileSync, mkdirSync, createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { progressManager, ProgressUpdate } from '../../../lib/progress';
import { uploadStreamToR2 } from '../../../lib/r2';
import { TMP_DIR } from '../../../lib/paths';

const binPath = join(process.cwd(), 'node_modules', 'yt-dlp-exec', 'bin', 'yt-dlp');
const youtubeDl = create(binPath);

const youtubeCookiesBrowser = process.env.YTDLP_COOKIES_BROWSER;

const BOT_BLOCK_REGEX =
  /Sign in to confirm|confirm you.{0,10}re not a bot|bot detection|age-restricted/i;

// ── Invidious resolver ────────────────────────────────────────────────────────
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.privacyredirect.com',
  'https://yt.cdaut.de',
  'https://invidious.fdn.fr',
];

interface InvidiousStream {
  type: string;
  url: string;
  quality: string;
}

function extractVideoId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  );
  return m?.[1] ?? null;
}

async function resolveStreamViaInvidious(videoId: string): Promise<string | null> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(
        `${instance}/api/v1/videos/${videoId}?fields=formatStreams`,
        { signal: AbortSignal.timeout(6000), headers: { 'User-Agent': 'SermonClipper/1.0' } },
      );
      if (!res.ok) continue;

      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) continue;

      const data = await res.json() as { formatStreams?: InvidiousStream[] };
      const QUALITY_ORDER = ['hd1080', 'hd720', 'large', 'medium', 'small', 'tiny'];
      const best = (data.formatStreams ?? [])
        .filter(s => s.type?.startsWith('video/mp4'))
        .sort((a, b) => {
          const ai = QUALITY_ORDER.indexOf(a.quality);
          const bi = QUALITY_ORDER.indexOf(b.quality);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        })[0];

      if (best?.url) {
        console.log(`[Download] Invidious resolved stream from ${instance} (${best.quality})`);
        return best.url;
      }
    } catch (err) {
      console.warn(`[Download] Invidious instance ${instance} failed:`, err);
    }
  }
  return null;
}

async function downloadDirectStream(streamUrl: string, filePath: string): Promise<void> {
  const res = await fetch(streamUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Referer: 'https://www.youtube.com/',
    },
    signal: AbortSignal.timeout(300_000), // 5 min
  });
  if (!res.ok) throw new Error(`Direct download HTTP ${res.status}: ${res.statusText}`);
  if (!res.body) throw new Error('No response body from stream URL');
  await pipeline(
    Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]),
    createWriteStream(filePath),
  );
}

// ── yt-dlp helpers ────────────────────────────────────────────────────────────
function buildBaseFlags(filePath: string, format: string): Record<string, unknown> {
  return { output: filePath, format, noCheckCertificate: true, noWarnings: true };
}

function applyPlayerClient(flags: Record<string, unknown>, playerClient: string): Record<string, unknown> {
  return { ...flags, extractorArgs: `youtube:player_client=${playerClient}` };
}

function applyCookies(flags: Record<string, unknown>, cookiePath?: string): Record<string, unknown> {
  if (cookiePath && existsSync(cookiePath)) return { ...flags, cookies: cookiePath };
  if (youtubeCookiesBrowser) return { ...flags, cookiesFromBrowser: youtubeCookiesBrowser };
  return flags;
}

async function runYtDlp(url: string, flags: Record<string, unknown>): Promise<void> {
  console.log('[Download] yt-dlp flags:', JSON.stringify(flags));
  const output = await youtubeDl(url, flags as Parameters<typeof youtubeDl>[1]);
  console.log('[Download] yt-dlp output:', JSON.stringify(output));
}

// ── Background download job ───────────────────────────────────────────────────
async function runDownloadJob(url: string, jobId: string): Promise<void> {
  // Use system absolute /tmp directory (writable on almost all cloud platforms)
  const tmpDir = '/tmp';
  
  // Provision cookies from YTDLP_COOKIES_CONTENT if available
  let cookiePath = process.env.YTDLP_COOKIES_PATH;
  const cookieContent = process.env.YTDLP_COOKIES_CONTENT;

  if (cookieContent && !cookiePath) {
    const provPath = join(tmpDir, `youtube_cookies_${jobId}.txt`);
    try {
      writeFileSync(provPath, cookieContent);
      cookiePath = provPath;
      console.log(`[Download] Provisioned cookies to ${provPath}`);
    } catch (err) {
      console.error('[Download] Failed to write cookies to /tmp:', err);
    }
  }

  const fileName = `${uuidv4()}.mp4`;
  const filePath = join(tmpDir, fileName);

  const FORMAT_BEST = 'bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/bestvideo[ext=mp4]+bestaudio/best[ext=mp4]/best';
  const FORMAT_FALLBACK = 'best[ext=mp4]/best';

  let succeeded = false;
  let lastError = '';

  // Stage 0: Invidious
  const videoId = extractVideoId(url);
  if (videoId) {
    try {
      const streamUrl = await resolveStreamViaInvidious(videoId);
      if (streamUrl) {
        console.log('[Download] Stage 0 (Invidious): downloading...');
        await downloadDirectStream(streamUrl, filePath);
        succeeded = true;
      }
    } catch (err) {
      console.warn('[Download] Stage 0 (Invidious) failed:', err);
    }
  }

  // Stages 1-4: yt-dlp waterfall
  if (!succeeded) {
    const stages: Array<{ label: string; flags: Record<string, unknown> }> = [
      { label: 'ios player',      flags: applyPlayerClient(buildBaseFlags(filePath, FORMAT_BEST), 'ios') },
      { label: 'mweb player',     flags: applyPlayerClient(buildBaseFlags(filePath, FORMAT_FALLBACK), 'mweb') },
      { label: 'tv_embedded',     flags: applyPlayerClient(buildBaseFlags(filePath, FORMAT_FALLBACK), 'tv_embedded') },
      { label: 'cookies+web',     flags: applyCookies(applyPlayerClient(buildBaseFlags(filePath, FORMAT_FALLBACK), 'web'), cookiePath) },
    ];

    for (const stage of stages) {
      try {
        console.log(`[Download] Trying stage: ${stage.label}`);
        await runYtDlp(url, stage.flags);
        succeeded = true;
        break;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
        console.warn(`[Download] Stage "${stage.label}" failed:`, lastError.slice(0, 200));
        if (/Video unavailable|Private video/i.test(lastError)) {
          progressManager.update(jobId, { step: 'Uploading', status: 'error', message: `Video unavailable or private.` });
          return;
        }
      }
    }
  }

  if (!succeeded) {
    const hint = BOT_BLOCK_REGEX.test(lastError) ? ' Check your YouTube cookies in Koyeb env vars.' : '';
    progressManager.update(jobId, {
      step: 'Uploading',
      status: 'error',
      message: `YouTube download failed: ${lastError.slice(0, 300)}${hint}`,
    });
    return;
  }

  // Find the file
  let finalPath = filePath;
  if (!existsSync(filePath)) {
    const files = await readdir(tmpDir);
    const baseName = fileName.replace('.mp4', '');
    const found = files.find(f => f.startsWith(baseName));
    if (found) finalPath = join(tmpDir, found);
    else {
      progressManager.update(jobId, { step: 'Uploading', status: 'error', message: 'Downloaded file not found on disk.' });
      return;
    }
  }

  console.log(`[Download] Final path: ${finalPath}`);

  let r2Key: string | undefined;
  let r2Url: string | undefined;

  try {
    const stream = createReadStream(finalPath);
    const remoteName = basename(finalPath);
    r2Key = `downloads/${jobId}/${remoteName}`;
    r2Url = await uploadStreamToR2(r2Key, stream, 'video/mp4');
    console.log('[Download] Uploaded to R2:', r2Key);
  } catch (r2Err: unknown) {
    console.warn('[Download] R2 upload skipped:', r2Err instanceof Error ? r2Err.message : r2Err);
  }

  progressManager.update(jobId, {
    step: 'Uploading',
    status: 'completed',
    message: 'YouTube download complete',
    filePath: finalPath,
    r2Key,
    r2Url,
  });
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { url, jobId = uuidv4() } = await req.json();
    console.log(`[Download] Received jobId=${jobId} url=${url}`);

    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });

    progressManager.update(jobId, { step: 'Uploading', status: 'loading', message: 'Starting YouTube download...' });

    // Fire in background
    runDownloadJob(url, jobId).catch(err => {
      console.error('[Download] Unhandled job error:', err);
      progressManager.update(jobId, { step: 'Uploading', status: 'error', message: String(err) });
    });

    return NextResponse.json({ success: true, jobId });
  } catch (error: unknown) {
    console.error('[Download] Critical error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
