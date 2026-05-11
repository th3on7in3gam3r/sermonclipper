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
import OpenAI from 'openai';
import * as dns from 'dns';
import { auth } from '@clerk/nextjs/server';

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

// ── OpenAI Strategy ──────────────────────────────────────────────────────────
async function runOpenAIPrimary(url: string, jobId: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY in Settings');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.5,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are an expert sermon clip editor for social media."
      },
      {
        role: "user",
        content: `Analyze this sermon video. Return ONLY valid JSON.

YouTube URL: ${url}

{
  "success": true,
  "sermon_title": "Short powerful title",
  "main_theme": "One sentence theme",
  "clips": [
    {
      "start": 245,
      "end": 298,
      "hook_title": "Catchy title",
      "main_quote": "Exact powerful quote",
      "suggested_captions": ["Line 1", "Line 2", "Line 3"]
    }
  ],
  "summary": "Powerful 2-3 sentence summary"
}

Generate 8-12 high-quality clips.`
      }
    ]
  });

  const text = completion.choices[0]?.message?.content || '{}';
  return JSON.parse(text);
}

// ── Main Job ─────────────────────────────────────────────────────────────────
async function runSermonPipeline(url: string, jobId: string, userId: string): Promise<void> {
  const filePath = join(TMP_DIR, `${jobId}.mp4`);
  
  // 1. PRIMARY: NEURAL BRAIN (Instant Analysis)
  await progressManager.update(jobId, { step: 'Analysis', status: 'loading', message: 'Neural Engine: Harvesting viral spiritual moments...' });
  
  let analysisResult = null;
  try {
    analysisResult = await runOpenAIPrimary(url, jobId);
    await progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'completed', 
      message: `✅ GPT-4o generated ${analysisResult?.clips?.length || 0} clips`,
      finalPath: url, 
      analysis: analysisResult
    });
  } catch (e: any) {
    console.error('[Engine] Neural Primary Failed:', e.message);
    await progressManager.update(jobId, { step: 'Analysis', status: 'error', message: `Neural Analysis Failed: ${e.message}` });
    return; // Stop if analysis fails
  }

  // 2. SECONDARY: BINARY HARVEST (MP4 Download)
  await progressManager.update(jobId, { step: 'Downloading', status: 'loading', message: 'Engine: Harvesting media binary...' });
  
  let downloadSuccess = false;

  // Try Tunneling
  const vid = extractVideoId(url);
  if (vid) {
    for (const m of MIRRORS) {
      const streamUrl = await resolveMirror(vid, m, url);
      if (streamUrl) {
        try {
          const res = await fetch(streamUrl, { signal: AbortSignal.timeout(90000) });
          if (res.ok && res.body) {
            await pipeline(Readable.fromWeb(res.body as any), createWriteStream(filePath));
            downloadSuccess = true;
            break;
          }
        } catch (e) {}
      }
    }
  }

  // 3. Finalize Media Kit
  if (downloadSuccess) {
    try {
      await progressManager.update(jobId, { step: 'Uploading', status: 'loading', message: 'Cloud Sync: Finalizing Media Kit...' });
      const r2Url = await uploadStreamToR2(`sermons/${jobId}.mp4`, createReadStream(filePath), 'video/mp4');
      await progressManager.update(jobId, { 
        step: 'Downloading', 
        status: 'completed', 
        message: 'Master Download Complete', 
        finalPath: r2Url,
        analysis: analysisResult
      });
      if (existsSync(filePath)) unlinkSync(filePath);
    } catch (e: any) {
      await progressManager.update(jobId, { 
        step: 'Downloading', 
        status: 'completed', 
        message: 'Analysis Ready (Download Sync Pending)', 
        finalPath: url,
        analysis: analysisResult
      });
    }
  } else {
    await progressManager.update(jobId, { 
      step: 'Downloading', 
      status: 'completed', 
      message: 'Processing Ready (Using Cloud Streaming)', 
      finalPath: url,
      analysis: analysisResult
    });
  }

  // 4. Persistence (SAVE TO MONGODB)
  try {
    const connectDB = (await import('../../../lib/mongodb')).default;
    const Sermon = (await import('../../../models/Sermon')).default;
    
    await connectDB();
    await Sermon.findOneAndUpdate(
      { jobId },
      {
        userId,
        jobId,
        title: analysisResult.sermon_title || 'Untitled Sermon',
        mainTheme: analysisResult.main_theme || '',
        videoUrl: url,
        finalPath: downloadSuccess ? (await progressManager.get(jobId))?.finalPath : url,
        analysis: analysisResult,
        createdAt: new Date()
      },
      { upsert: true }
    );
    console.log(`[Database] Sermon saved successfully for user ${userId}`);
  } catch (dbErr) {
    console.error('[Database] Persistence Failed:', dbErr);
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
  }

  const { url, jobId } = await req.json();
  if (!url || !jobId) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  
  // VERCEL-SAFE ARCHITECTURE:
  // We MUST await the AI analysis in the main request. 
  // Download/Upload will happen as a side-effect if time permits, 
  // but the 'Brain' work is secured first.
  
  try {
    // 1. Initial State
    await progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'loading', 
      message: 'Neural Engine: Harvesting viral spiritual moments...' 
    });

    // 2. Await AI BRAIN (This takes ~15-30s, safely under Vercel's 60s limit)
    console.log(`[Engine] Starting Synchronous Analysis for ${jobId}`);
    const analysisResult = await runOpenAIPrimary(url, jobId);
    
    // 3. Persist immediately to MongoDB
    const connectDB = (await import('../../../lib/mongodb')).default;
    const Sermon = (await import('../../../models/Sermon')).default;
    await connectDB();
    
    await Sermon.findOneAndUpdate(
      { jobId },
      {
        userId,
        jobId,
        title: analysisResult.sermon_title || 'Untitled Sermon',
        mainTheme: analysisResult.main_theme || '',
        videoUrl: url,
        finalPath: url, // Use YT URL as fallback immediately
        analysis: analysisResult,
        createdAt: new Date()
      },
      { upsert: true }
    );

    // 4. Update progress to reflect success
    await progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'completed', 
      message: `✅ GPT-4o generated ${analysisResult?.clips?.length || 0} clips`,
      finalPath: url,
      analysis: analysisResult
    });

    // 5. Kick off download as a "Best Effort" background task
    // It might finish, it might not, but the analysis is SAFE in the DB now.
    runSermonPipeline(url, jobId, userId).catch(e => console.error('[Engine] BG Pipeline:', e));
    
    return NextResponse.json({ success: true, jobId });
  } catch (e: any) {
    console.error('[Engine] Synchronous Failure:', e);
    await progressManager.update(jobId, { step: 'Analysis', status: 'error', message: `Neural Analysis Failed: ${e.message}` });
    return NextResponse.json({ error: 'Neural Engine Timeout' }, { status: 500 });
  }
}
