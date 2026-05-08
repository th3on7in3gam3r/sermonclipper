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
  dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8']);
} catch (e) {
  console.warn('[Engine] DNS redundancy active.');
}

const MIRRORS = [
  { name: 'Clipper Global A', type: 'invidious', url: 'https://invidious.projectsegfau.lt' },
  { name: 'Clipper Global B', type: 'piped', url: 'https://pipedapi.kavin.rocks' },
  { name: 'Clipper Global C', type: 'invidious', url: 'https://iv.melmac.space' },
  { name: 'Clipper Global D', type: 'piped', url: 'https://pipedapi.lunar.icu' },
  { name: 'Clipper Global E', type: 'invidious', url: 'https://yewtu.be' },
];

const BOT_BLOCK_REGEX = /Sign in to confirm|confirm you.{0,10}re not a bot|bot detection|age-restricted|403|Forbidden|blocked|unavailable/i;
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ── Helpers ──────────────────────────────────────────────────────────────────
function extractVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function sanitizeCookies(content: string): string {
  if (!content) return '';
  return content.split('\n').map(line => {
    if (line.startsWith('#') || !line.trim()) return line;
    const parts = line.split(/\s+/).filter(Boolean);
    if (parts.length >= 7) return parts.slice(0, 7).join('\t');
    return line;
  }).join('\n');
}

async function resolveMirror(videoId: string, mirror: any): Promise<string | null> {
  try {
    if (mirror.type === 'invidious') {
      const res = await fetch(`${mirror.url}/api/v1/videos/${videoId}?fields=formatStreams`, {
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const stream = data.formatStreams?.find((s: any) => s.quality === 'hd720' && s.type?.includes('mp4'))
                  || data.formatStreams?.find((s: any) => s.type?.includes('mp4'));
      return stream?.url || null;
    } else {
      const res = await fetch(`${mirror.url}/streams/${videoId}`, {
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const stream = data.videoStreams?.find((s: any) => s.format === 'VIDEO_STREAM_TYPE_MP4' && s.quality === '720p')
                  || data.videoStreams?.find((s: any) => s.format === 'VIDEO_STREAM_TYPE_MP4');
      return stream?.url || null;
    }
  } catch { return null; }
}

async function runYtDlp(url: string, filePath: string, client: string, jobId: string, cookiePath?: string): Promise<void> {
  const args = [
    url, 
    '--output', filePath, 
    '--format', 'best[ext=mp4]/best', 
    '--no-warnings', 
    '--force-ipv4',
    '--geo-bypass',
    '--no-check-certificate',
    '--user-agent', CHROME_UA
  ];
  
  if (client !== 'web') args.push('--extractor-args', `youtube:player_client=${client}`);
  if (cookiePath && existsSync(cookiePath)) args.push('--cookies', cookiePath);

  return new Promise((resolve, reject) => {
    const child = spawn('yt-dlp', args);
    let fullStderr = '';
    child.stderr.on('data', (d) => { 
      const raw = d.toString().trim();
      if (raw) {
        fullStderr += raw + '\n';
        progressManager.update(jobId, { step: 'Uploading', status: 'loading', message: `[Raw] ${raw.split('\n')[0].slice(0, 80)}` });
      }
    });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else {
        const lines = fullStderr.split('\n').filter(l => l.trim());
        reject(new Error(lines[lines.length - 1] || `Exit Code ${code}`));
      }
    });
    setTimeout(() => { child.kill(); reject(new Error('Process Timeout')); }, 300000);
  });
}

// ── Main Job ─────────────────────────────────────────────────────────────────
async function runDownloadJob(url: string, jobId: string): Promise<void> {
  const filePath = join(TMP_DIR, `${uuidv4()}.mp4`);
  let cookiePath: string | undefined;
  
  const rawCookies = process.env.YTDLP_COOKIES_CONTENT || process.env.YTDLP_COOKIES;
  if (rawCookies && rawCookies.length > 50) {
    cookiePath = join(TMP_DIR, `ck_${jobId}.txt`);
    writeFileSync(cookiePath, sanitizeCookies(rawCookies));
  }

  let success = false;
  let lastRawError = '';

  // 1. Ghost Mirror Tunnel
  const vid = extractVideoId(url);
  if (vid) {
    for (const m of MIRRORS) {
      progressManager.update(jobId, { step: 'Uploading', status: 'loading', message: `Tunneling via ${m.name}...` });
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

  // 2. Protocol Waterfall
  if (!success) {
    const stages = [
      { id: 'web', label: 'Chrome (Auth)', auth: true },
      { id: 'android', label: 'Android' },
      { id: 'ios', label: 'iOS Mobile' },
      { id: 'tv_embedded', label: 'TV Set-top' },
      { id: 'mweb', label: 'Mobile Safari' },
    ];
    for (const s of stages) {
      progressManager.update(jobId, { step: 'Uploading', status: 'loading', message: `Protocol: Trying ${s.label}...` });
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
    const isBot = BOT_BLOCK_REGEX.test(lastRawError);
    const msg = isBot ? `Neural Block: YouTube is demanding authentication mirrors couldn't bypass.` : `Critical Error: ${lastRawError}`;
    progressManager.update(jobId, { step: 'Uploading', status: 'error', message: msg });
    return;
  }

  // 3. Finalize
  try {
    progressManager.update(jobId, { step: 'Uploading', status: 'loading', message: 'Syncing: Media Kit assembly...' });
    const r2Url = await uploadStreamToR2(`sermons/${jobId}.mp4`, createReadStream(filePath), 'video/mp4');
    progressManager.update(jobId, { step: 'Uploading', status: 'completed', message: 'Ready', r2Url, finalPath: r2Url });
    if (existsSync(filePath)) unlinkSync(filePath);
    if (cookiePath && existsSync(cookiePath)) unlinkSync(cookiePath);
  } catch (e: any) {
    progressManager.update(jobId, { step: 'Uploading', status: 'error', message: 'Cloud Sync Failed.' });
  }
}

export async function POST(req: NextRequest) {
  const { url, jobId } = await req.json();
  if (!url || !jobId) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  progressManager.update(jobId, { step: 'Uploading', status: 'loading', message: 'Waking Neural Engine...' });
  runDownloadJob(url, jobId).catch(() => {});
  return NextResponse.json({ success: true });
}
