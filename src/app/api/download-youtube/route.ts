import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { existsSync, createWriteStream, createReadStream, writeFileSync, unlinkSync } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { progressManager } from '../../../lib/progress';
import { uploadStreamToR2 } from '../../../lib/r2';
import { TMP_DIR } from '../../../lib/paths';
import { spawn } from 'child_process';
import * as dns from 'dns';

// ── Configuration ────────────────────────────────────────────────────────────
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('[Engine] Custom DNS setup skipped.');
}

const MIRRORS = [
  { name: 'Invidious (Alt)', type: 'invidious', url: 'https://invidious.projectsegfau.lt' },
  { name: 'Piped (Alt)', type: 'piped', url: 'https://pipedapi.kavin.rocks' },
  { name: 'Invidious (Secondary)', type: 'invidious', url: 'https://yewtu.be' },
];

const BOT_BLOCK_REGEX = /Sign in to confirm|confirm you.{0,10}re not a bot|bot detection|age-restricted|403|Forbidden/i;

// ── Helpers ──────────────────────────────────────────────────────────────────
function extractVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

async function resolveMirror(videoId: string, mirror: any): Promise<string | null> {
  try {
    if (mirror.type === 'invidious') {
      const res = await fetch(`${mirror.url}/api/v1/videos/${videoId}?fields=formatStreams`, {
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      return data.formatStreams?.find((s: any) => s.type?.includes('mp4'))?.url || null;
    } else {
      const res = await fetch(`${mirror.url}/streams/${videoId}`, {
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      return data.videoStreams?.find((s: any) => s.format === 'VIDEO_STREAM_TYPE_MP4')?.url || null;
    }
  } catch { return null; }
}

async function runYtDlp(url: string, filePath: string, client: string, jobId: string, cookiePath?: string): Promise<void> {
  const args = [url, '--output', filePath, '--format', 'best[ext=mp4]/best', '--no-warnings', '--force-ipv4'];
  if (client !== 'web') args.push('--extractor-args', `youtube:player_client=${client}`);
  if (cookiePath && existsSync(cookiePath)) args.push('--cookies', cookiePath);

  return new Promise((resolve, reject) => {
    const child = spawn('yt-dlp', args);
    
    child.stderr.on('data', (d) => { 
      const raw = d.toString().trim();
      if (raw) {
        // Stream raw error to UI if it looks important
        progressManager.update(jobId, { 
          step: 'Uploading', 
          status: 'loading', 
          message: `[Raw] ${raw.split('\n')[0].slice(0, 80)}` 
        });
      }
    });

    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Exit Code ${code}`)));
    setTimeout(() => { child.kill(); reject(new Error('Process timed out')); }, 300000);
  });
}

// ── Main Job ─────────────────────────────────────────────────────────────────
async function runDownloadJob(url: string, jobId: string): Promise<void> {
  const filePath = join(TMP_DIR, `${uuidv4()}.mp4`);
  let cookiePath: string | undefined;
  
  // Cookie Setup
  const rawCookies = process.env.YTDLP_COOKIES_CONTENT || process.env.YTDLP_COOKIES;
  if (rawCookies) {
    cookiePath = join(TMP_DIR, `ck_${jobId}.txt`);
    writeFileSync(cookiePath, rawCookies);
    progressManager.update(jobId, { step: 'Uploading', status: 'loading', message: `Auth: Cookie provided (${rawCookies.length} bytes)` });
  } else {
    progressManager.update(jobId, { step: 'Uploading', status: 'loading', message: 'Auth: No cookies in ENV' });
  }

  let success = false;
  let lastRawError = '';

  // 1. Mirror Waterfall
  const vid = extractVideoId(url);
  if (vid) {
    for (const m of MIRRORS) {
      progressManager.update(jobId, { step: 'Uploading', status: 'loading', message: `Mirror: Trying ${m.name}...` });
      const streamUrl = await resolveMirror(vid, m);
      if (streamUrl) {
        try {
          const res = await fetch(streamUrl, { signal: AbortSignal.timeout(60000) });
          if (res.ok && res.body) {
            await pipeline(Readable.fromWeb(res.body as any), createWriteStream(filePath));
            success = true;
            break;
          }
        } catch (e) { console.warn(`[Engine] Mirror ${m.name} failed.`); }
      }
    }
  }

  // 2. yt-dlp Waterfall
  if (!success) {
    const stages = [
      { id: 'android', label: 'Android Protocol' },
      { id: 'ios', label: 'iOS Protocol' },
      { id: 'tv_embedded', label: 'TV Protocol' },
      { id: 'web', label: 'Web (Auth)', auth: true },
    ];
    for (const s of stages) {
      progressManager.update(jobId, { step: 'Uploading', status: 'loading', message: `Attempting ${s.label}...` });
      try {
        await runYtDlp(url, filePath, s.id, jobId, s.auth ? cookiePath : undefined);
        success = true;
        break;
      } catch (e: any) {
        lastRawError = e.message;
        console.warn(`[Engine] Stage ${s.id} failed.`);
      }
    }
  }

  if (!success) {
    progressManager.update(jobId, { 
      step: 'Uploading', 
      status: 'error', 
      message: `Critical Failure: ${lastRawError}` 
    });
    return;
  }

  // 3. Finalize
  try {
    progressManager.update(jobId, { step: 'Uploading', status: 'loading', message: 'Syncing to Cloud Storage...' });
    const r2Url = await uploadStreamToR2(`sermons/${jobId}.mp4`, createReadStream(filePath), 'video/mp4');
    progressManager.update(jobId, { step: 'Uploading', status: 'completed', message: 'Download Success', r2Url, finalPath: r2Url });
    if (existsSync(filePath)) unlinkSync(filePath);
    if (cookiePath && existsSync(cookiePath)) unlinkSync(cookiePath);
  } catch (e: any) {
    progressManager.update(jobId, { step: 'Uploading', status: 'error', message: 'Cloud Sync Failed.' });
  }
}

export async function POST(req: NextRequest) {
  const { url, jobId } = await req.json();
  progressManager.update(jobId, { step: 'Uploading', status: 'loading', message: 'Initializing Neural Engine...' });
  runDownloadJob(url, jobId).catch(() => {});
  return NextResponse.json({ success: true });
}
