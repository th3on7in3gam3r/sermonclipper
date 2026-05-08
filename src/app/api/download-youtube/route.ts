import { NextRequest, NextResponse } from 'next/server';
import { create } from 'yt-dlp-exec';
import { v4 as uuidv4 } from 'uuid';
import { join, basename } from 'path';
import { mkdir, readdir, readFile } from 'fs/promises';
import { existsSync, createWriteStream, writeFileSync, mkdirSync, createReadStream, readFileSync } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { progressManager, ProgressUpdate } from '../../../lib/progress';
import { uploadStreamToR2 } from '../../../lib/r2';
import { TMP_DIR } from '../../../lib/paths';
import * as dns from 'dns';

// Force Google DNS to fix ENOTFOUND issues on Koyeb
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('Could not set custom DNS servers:', e);
}

const youtubeDl = create('yt-dlp');

const youtubeCookiesBrowser = process.env.YTDLP_COOKIES_BROWSER;

const BOT_BLOCK_REGEX =
  /Sign in to confirm|confirm you.{0,10}re not a bot|bot detection|age-restricted/i;

const INVIDIOUS_INSTANCES = [
  'https://invidious.projectsegfau.lt',
  'https://invidious.perennialte.ch',
  'https://iv.melmac.space',
  'https://invidious.snopyta.org',
  'https://yewtu.be',
  'https://invidious.nerdvpn.de',
  'https://invidious.tiekoetter.com',
  'https://invidious.v0l.me',
];

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.lunar.icu',
  'https://pipedapi.privacy.com.de',
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

async function resolveStreamViaPiped(videoId: string): Promise<string | null> {
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}/streams/${videoId}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      // Piped returns a list of streams, we want the best video+audio mp4 or combined
      const stream = data.videoStreams?.find((s: any) => s.format === 'VIDEO_STREAM_TYPE_MP4' && s.videoOnly === false) 
                  || data.videoStreams?.[0];
      if (stream?.url) {
        console.log(`[Download] Found Piped stream from ${instance}`);
        return stream.url;
      }
    } catch (e) {
      console.warn(`[Download] Piped instance ${instance} failed:`, e);
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

const binPath = 'yt-dlp';

// ── Shell Execution Helper ───────────────────────────────────────────────────
import { spawn } from 'child_process';

async function runYtDlp(url: string, filePath: string, client: string, cookiePath?: string): Promise<void> {
  const args = [
    url,
    '--output', filePath,
    '--format', 'best[ext=mp4]/best',
    '--no-check-certificate',
    '--no-warnings',
    '--force-ipv4',
    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
  ];

  if (client !== 'web') {
    args.push('--extractor-args', `youtube:player_client=${client}`);
  }

  if (cookiePath && existsSync(cookiePath)) {
    args.push('--cookies', cookiePath);
  }

  console.log(`[Download] Spawning: yt-dlp ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    const child = spawn('yt-dlp', args);
    let stderr = '';
    let stdout = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        const errorMsg = stderr || stdout || `Process exited with code ${code}`;
        console.error(`[Download] yt-dlp failed: ${errorMsg}`);
        reject(new Error(errorMsg));
      }
    });

    child.on('error', (err) => {
      console.error(`[Download] Spawn error: ${err.message}`);
      reject(err);
    });
  });
}

// ── Background download job ───────────────────────────────────────────────────
async function runDownloadJob(url: string, jobId: string): Promise<void> {
  // Use system absolute /tmp directory (writable on almost all cloud platforms)
  const tmpDir = '/tmp';
  
  // Provision cookies from YTDLP_COOKIES_CONTENT if available
  let cookiePath: string | undefined = undefined;
  const cookieContent = process.env.YTDLP_COOKIES_CONTENT || process.env.YTDLP_COOKIES || process.env.YTDLP_COOKIES_PATH;

  if (cookieContent && !cookiePath) {
    const provPath = join(tmpDir, `youtube_cookies_${jobId}.txt`);
    try {
      // Sanitize cookies: convert space-separated rows to tab-separated Netscape format
      const sanitized = cookieContent.split('\n').map(line => {
        if (line.startsWith('#') || !line.trim()) return line;
        // If the line has spaces but no tabs, it's likely a malformed copy-paste
        if (line.includes(' ') && !line.includes('\t')) {
          // Attempt to split by space/multiple spaces and join with tabs
          // Netscape format expects exactly 7 columns
          const parts = line.split(/\s+/).filter(Boolean);
          if (parts.length >= 7) {
            // Join first 6 columns, then the rest is the value (which might contain spaces)
            const first6 = parts.slice(0, 6);
            const value = parts.slice(6).join(' ');
            return [...first6, value].join('\t');
          }
        }
        return line;
      }).join('\n');

      writeFileSync(provPath, sanitized);
      cookiePath = provPath;
      console.log(`[Download] Provisioned and SANITIZED cookies to ${provPath} (Length: ${sanitized.length})`);
      
      // DIAGNOSTIC: Read the first line back to verify integrity
      try {
        const firstLine = readFileSync(provPath, 'utf8').split('\n')[0];
        console.log(`[Download] Cookie Diagnostic (First Line): ${firstLine.slice(0, 50)}...`);
      } catch (diagErr) {
        console.error('[Download] Cookie Diagnostic FAILED:', diagErr);
      }
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

  // Stage 0: Invidious/Piped Waterfall
  const videoId = extractVideoId(url);
  if (videoId) {
    try {
      console.log(`[Download] Stage 0: Attempting Invidious for ${videoId}`);
      const streamUrl = await resolveStreamViaInvidious(videoId);
      if (streamUrl) {
        await downloadDirectStream(streamUrl, filePath);
        succeeded = true;
      } else {
        console.log(`[Download] Stage 0: Invidious failed, attempting Piped for ${videoId}`);
        const pipedUrl = await resolveStreamViaPiped(videoId);
        if (pipedUrl) {
          await downloadDirectStream(pipedUrl, filePath);
          succeeded = true;
        }
      }
    } catch (err) {
      console.warn('[Download] Stage 0 (Invidious/Piped) failed:', err);
    }
  }

  // Stages 1-4: yt-dlp waterfall
  if (!succeeded) {
    const stages = [
      { label: 'android player', client: 'android' },
      { label: 'ios player',     client: 'ios' },
      { label: 'tv_embedded',    client: 'tv_embedded' },
      { label: 'cookies+web',    client: 'web', useCookies: true },
    ];

    for (const stage of stages) {
      try {
        console.log(`[Download] Trying stage: ${stage.label}`);
        const activeCookiePath = stage.useCookies ? cookiePath : undefined;
        await runYtDlp(url, filePath, stage.client, activeCookiePath);
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
