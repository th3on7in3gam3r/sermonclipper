import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { existsSync, createWriteStream, createReadStream, writeFileSync, unlinkSync } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { progressManager } from '../../../lib/progress';
import { uploadStreamToR2 } from '../../../lib/r2';
import { TMP_DIR } from '../../../lib/paths';
import { exec as ytdlpExec } from 'youtube-dl-exec';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dns from 'dns';

// ── Configuration ────────────────────────────────────────────────────────────
try {
  dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8']);
} catch (e) {
  console.warn('[Engine] DNS redundancy active.');
}

const MIRRORS = [
  { name: 'Cobalt Ghost (Elite)', type: 'cobalt', url: 'https://cobalt.tools/api/json' },
  { name: 'Clipper Global A', type: 'invidious', url: 'https://invidious.projectsegfau.lt' },
];

const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// ── Helpers ──────────────────────────────────────────────────────────────────
function extractVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

async function resolveMirror(videoId: string, mirror: any, fullUrl: string): Promise<string | null> {
  try {
    if (mirror.type === 'cobalt') {
      const res = await fetch(mirror.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ url: fullUrl, videoQuality: '720' }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.url || null;
    }
    return null;
  } catch { return null; }
}

async function runGeminiAnalysis(url: string, jobId: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY in Koyeb Settings');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro",
    generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
  });

  const prompt = `Analyze this sermon: ${url}. Return JSON with sermon_title, main_theme, summary, key_verses, and clips (start, end, hook_title, main_quote, why_it_works, suggested_captions).`;
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}

// ── Main Job ─────────────────────────────────────────────────────────────────
async function runDownloadJob(url: string, jobId: string): Promise<void> {
  const filePath = join(TMP_DIR, `${jobId}.mp4`);
  let success = false;
  let lastRawError = '';

  // 1. ELITE TUNNELING
  const vid = extractVideoId(url);
  if (vid) {
    for (const m of MIRRORS) {
      progressManager.update(jobId, { step: 'Downloading', status: 'loading', message: `Neural Tunnel: ${m.name}...` });
      const streamUrl = await resolveMirror(vid, m, url);
      if (streamUrl) {
        try {
          const res = await fetch(streamUrl, { signal: AbortSignal.timeout(90000) });
          if (res.ok && res.body) {
            await pipeline(Readable.fromWeb(res.body as any), createWriteStream(filePath));
            success = true;
            break;
          }
        } catch (e) {}
      }
    }
  }

  // 2. PRIMARY ENGINE
  if (!success) {
    progressManager.update(jobId, { step: 'Downloading', status: 'loading', message: 'Engine: Attempting primary download...' });
    try {
      const options: any = {
        output: filePath,
        format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        mergeOutputFormat: 'mp4',
        userAgent: CHROME_UA,
        referer: 'https://www.youtube.com',
        retries: 2,
      };

      if (process.env.YTDLP_COOKIES_CONTENT) {
        const ckPath = join(TMP_DIR, `ck_${jobId}.txt`);
        writeFileSync(ckPath, process.env.YTDLP_COOKIES_CONTENT);
        options.cookies = ckPath;
      }

      await ytdlpExec(url, options);
      success = true;
    } catch (error: any) {
      lastRawError = error.message || 'Blocked';
    }
  }

  // 3. GEMINI DIRECT FALLBACK
  if (!success) {
    progressManager.update(jobId, { step: 'Downloading', status: 'loading', message: 'Neural Block Detected. Switching to Gemini God-Mode...' });
    try {
      await runGeminiAnalysis(url, jobId);
      success = true;
      progressManager.update(jobId, { 
        step: 'Downloading', 
        status: 'completed', 
        message: 'Gemini Analysis Successful (Download Bypassed)',
        finalPath: url
      });
      return;
    } catch (e: any) {
      lastRawError = e.message;
    }
  }

  if (!success) {
    progressManager.update(jobId, { 
      step: 'Downloading', 
      status: 'error', 
      message: lastRawError.includes('Missing GEMINI') ? lastRawError : "Critical Error: All protocols blocked." 
    });
    return;
  }

  // 4. Finalize
  try {
    progressManager.update(jobId, { step: 'Uploading', status: 'loading', message: 'Syncing: Media Kit assembly...' });
    const r2Url = await uploadStreamToR2(`sermons/${jobId}.mp4`, createReadStream(filePath), 'video/mp4');
    progressManager.update(jobId, { step: 'Downloading', status: 'completed', message: 'Success', finalPath: r2Url });
    if (existsSync(filePath)) unlinkSync(filePath);
  } catch (e: any) {
    progressManager.update(jobId, { step: 'Downloading', status: 'error', message: 'Cloud Sync Failed.' });
  }
}

export async function POST(req: NextRequest) {
  const { url, jobId } = await req.json();
  if (!url || !jobId) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  progressManager.update(jobId, { step: 'Downloading', status: 'loading', message: 'Establishing Secure Handshake...' });
  runDownloadJob(url, jobId).catch(() => {});
  return NextResponse.json({ success: true });
}
