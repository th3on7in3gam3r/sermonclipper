import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { existsSync, createWriteStream, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { progressManager } from '../../../lib/progress';
import { uploadStreamToR2 } from '../../../lib/r2';
import { TMP_DIR } from '../../../lib/paths';
import { spawn } from 'child_process';
import * as dns from 'dns';

// ── Configuration ────────────────────────────────────────────────────────────
// Force Google DNS to resolve ENOTFOUND issues on Koyeb
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('[Engine] Could not set custom DNS servers:', e);
}

const INVIDIOUS_INSTANCES = [
  'https://invidious.projectsegfau.lt',
  'https://invidious.perennialte.ch',
  'https://iv.melmac.space',
  'https://yewtu.be',
  'https://invidious.tiekoetter.com',
];

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.lunar.icu',
];

const BOT_BLOCK_REGEX = /Sign in to confirm|confirm you.{0,10}re not a bot|bot detection|age-restricted/i;

// ── Helpers ──────────────────────────────────────────────────────────────────
function extractVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

async function resolveStreamViaInvidious(videoId: string): Promise<string | null> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${instance}/api/v1/videos/${videoId}?fields=formatStreams`, {
        signal: AbortSignal.timeout(6000),
        headers: { 'User-Agent': 'SermonClipper/2.0' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const QUALITY_ORDER = ['hd1080', 'hd720', 'large', 'medium', 'small'];
      const best = (data.formatStreams ?? [])
        .filter((s: any) => s.type?.startsWith('video/mp4'))
        .sort((a: any, b: any) => {
          const ai = QUALITY_ORDER.indexOf(a.quality);
          const bi = QUALITY_ORDER.indexOf(b.quality);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        })[0];
      if (best?.url) return best.url;
    } catch (err) {
      console.warn(`[Engine] Invidious ${instance} failed:`, err);
    }
  }
  return null;
}

async function resolveStreamViaPiped(videoId: string): Promise<string | null> {
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}/streams/${videoId}`, {
        signal: AbortSignal.timeout(6000),
        headers: { 'User-Agent': 'SermonClipper/2.0' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const stream = data.videoStreams?.find((s: any) => s.format === 'VIDEO_STREAM_TYPE_MP4' && s.videoOnly === false) 
                  || data.videoStreams?.[0];
      if (stream?.url) return stream.url;
    } catch (e) {
      console.warn(`[Engine] Piped ${instance} failed:`, e);
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
    signal: AbortSignal.timeout(600_000), // 10 min
  });
  if (!res.ok) throw new Error(`Direct download HTTP ${res.status}`);
  if (!res.body) throw new Error('No response body');
  await pipeline(Readable.fromWeb(res.body as any), createWriteStream(filePath));
}

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

  if (client !== 'web') args.push('--extractor-args', `youtube:player_client=${client}`);
  if (cookiePath && existsSync(cookiePath)) args.push('--cookies', cookiePath);

  console.log(`[Engine] Spawning yt-dlp stage: ${client}`);

  return new Promise((resolve, reject) => {
    const child = spawn('yt-dlp', args);
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `Exited with ${code}`));
    });
    child.on('error', reject);
    // Timeout safety
    setTimeout(() => {
      child.kill();
      reject(new Error('yt-dlp timeout (10m)'));
    }, 600_000);
  });
}

// ── Main Job ─────────────────────────────────────────────────────────────────
async function runDownloadJob(url: string, jobId: string): Promise<void> {
  const fileName = `${uuidv4()}.mp4`;
  const filePath = join(TMP_DIR, fileName);
  let cookiePath: string | undefined = undefined;
  
  // Provision cookies
  const cookieContent = process.env.YTDLP_COOKIES_PATH || process.env.YTDLP_COOKIES_CONTENT || process.env.YTDLP_COOKIES;
  if (cookieContent) {
    const provPath = join(TMP_DIR, `cookies_${jobId}.txt`);
    try {
      // Basic sanitization (spaces to tabs)
      const sanitized = cookieContent.split('\n').map(l => {
        if (l.startsWith('#') || !l.trim()) return l;
        if (l.includes(' ') && !l.includes('\t')) return l.split(/\s+/).filter(Boolean).slice(0, 7).join('\t');
        return l;
      }).join('\n');
      writeFileSync(provPath, sanitized);
      cookiePath = provPath;
    } catch (e) { console.error('[Engine] Cookie provision failed:', e); }
  }

  let succeeded = false;
  let lastError = '';

  // 1. Invidious/Piped Waterfall (No cookies needed)
  const videoId = extractVideoId(url);
  if (videoId) {
    try {
      console.log('[Engine] Trying Invidious...');
      const sUrl = await resolveStreamViaInvidious(videoId);
      if (sUrl) {
        await downloadDirectStream(sUrl, filePath);
        succeeded = true;
      } else {
        console.log('[Engine] Trying Piped...');
        const pUrl = await resolveStreamViaPiped(videoId);
        if (pUrl) {
          await downloadDirectStream(pUrl, filePath);
          succeeded = true;
        }
      }
    } catch (e) { console.warn('[Engine] Mirror waterfall failed:', e); }
  }

  // 2. yt-dlp Waterfall
  if (!succeeded) {
    const stages = [
      { client: 'android' },
      { client: 'ios' },
      { client: 'tv_embedded' },
      { client: 'web', useCookies: true },
    ];
    for (const stage of stages) {
      try {
        await runYtDlp(url, filePath, stage.client, stage.useCookies ? cookiePath : undefined);
        succeeded = true;
        break;
      } catch (e: any) {
        lastError = e.message;
        console.warn(`[Engine] Stage ${stage.client} failed:`, lastError.slice(0, 100));
      }
    }
  }

  if (!succeeded) {
    const hint = BOT_BLOCK_REGEX.test(lastError) ? ' (YouTube Bot Detection Blocked this request. Try Incognito Cookies.)' : '';
    progressManager.update(jobId, { step: 'Uploading', status: 'error', message: `Download failed: ${lastError.slice(0, 200)}${hint}` });
    return;
  }

  // 3. Upload & Finish
  try {
    progressManager.update(jobId, { step: 'Uploading', status: 'loading', message: 'Saving to Cloud Storage...' });
    const r2Key = `sermons/${fileName}`;
    const r2Url = await uploadStreamToR2(r2Key, createReadStream(filePath), 'video/mp4');
    
    progressManager.update(jobId, { 
      step: 'Uploading', 
      status: 'completed', 
      message: 'YouTube download complete',
      r2Key,
      r2Url,
      finalPath: r2Url // for backward compatibility
    });
    
    // Cleanup
    if (existsSync(filePath)) unlinkSync(filePath);
    if (cookiePath && existsSync(cookiePath)) unlinkSync(cookiePath);
  } catch (e: any) {
    progressManager.update(jobId, { step: 'Uploading', status: 'error', message: `Final processing failed: ${e.message}` });
  }
}

export async function POST(req: NextRequest) {
  const { url, jobId } = await req.json();
  if (!url || !jobId) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  
  progressManager.update(jobId, { step: 'Uploading', status: 'loading', message: 'Resolving YouTube stream...' });
  runDownloadJob(url, jobId).catch(e => console.error('[Engine] Job crashed:', e));
  
  return NextResponse.json({ success: true });
}
