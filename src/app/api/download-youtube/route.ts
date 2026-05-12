import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { existsSync, createWriteStream, createReadStream, unlinkSync } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { progressManager } from '../../../lib/progress';
import { uploadStreamToR2 } from '../../../lib/r2';
import { TMP_DIR } from '../../../lib/paths';
import OpenAI from 'openai';
import * as dns from 'dns';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// ── Configuration ────────────────────────────────────────────────────────────
try {
  dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8']);
} catch {
  console.warn('[Engine] DNS redundancy active.');
}

const MIRRORS = [
  { name: 'Cobalt Ghost (Elite)', type: 'cobalt', url: 'https://cobalt.tools/api/json' },
  { name: 'Clipper Global A', type: 'invidious', url: 'https://invidious.projectsegfau.lt' },
];

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
async function runOpenAIPrimary(url: string, _jobId: string) {
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
        content: "You are a World-Class Ministry Content Strategist and Social Media Expert. Your goal is to harvest high-impact, spiritually provocative, and emotionally resonant segments for viral social media clips (Reels, TikToks, Shorts)."
      },
      {
        role: "user",
        content: `Analyze this sermon: ${url}
        
        CRITICAL SELECTION CRITERIA:
        1. THE MIC DROP: Find moments where the speaker makes a definitive, life-changing point.
        2. THE HOOK: Ensure the clip starts with a strong statement or a provocative question.
        3. DURATION: Prioritize clips between 35 and 58 seconds.
        4. THEOLOGICAL CORE: Each clip must contain a complete thought or theological point.

        Return ONLY valid JSON:
        {
          "success": true,
          "sermon_title": "Cinematic Sermon Title",
          "main_theme": "The deep spiritual core of this message",
          "summary": "A 3-sentence theological summary for descriptions",
          "clips": [
            {
              "start": 245,
              "end": 298,
              "hook_title": "Catchy Viral Title",
              "main_quote": "The most powerful sentence in this clip",
              "suggested_captions": ["Short, punchy line 1", "Short, punchy line 2"],
              "viral_score": 95,
              "engagement_hook": "Why this clip will stop the scroll"
            }
          ]
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

  // Try Direct Download (R2/Direct Link)
  const vid = extractVideoId(url);
  if (!vid) {
    try {
      console.log('[Engine] Non-YouTube URL detected, attempting direct harvest...');
      const res = await fetch(url, { signal: AbortSignal.timeout(300000) });
      if (res.ok && res.body) {
        await pipeline(Readable.fromWeb(res.body as any), createWriteStream(filePath));
        downloadSuccess = true;
      }
    } catch (err: any) {
      console.error('[Engine] Direct harvest failed:', err.message);
    }
  }

  // Try Tunneling
  if (!downloadSuccess && vid) {
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
        } catch { /* mirror failed, try next */ }
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

  // ── Usage Limit Enforcement ──
  await connectDB();
  let dbUser = await User.findOne({ clerkId: userId });
  if (!dbUser) {
    dbUser = await User.create({ clerkId: userId, plan: 'free', usageCount: 0 });
  }

  // Monthly Reset Check
  const now = new Date();
  const resetDate = new Date(dbUser.lastUsageReset);
  if (now.getTime() - resetDate.getTime() > 30 * 24 * 60 * 60 * 1000) {
    dbUser.usageCount = 0;
    dbUser.lastUsageReset = now;
    await dbUser.save();
  }

  const limits: Record<string, number> = {
    'free': 2,
    'creator': 20,
    'church_pro': 999999
  };

  const limit = limits[dbUser.plan as string] || 2;
  if (dbUser.usageCount >= limit) {
    return NextResponse.json({ 
      error: 'Plan limit reached', 
      details: `Your ${dbUser.plan} plan is limited to ${limit} sermons per month. Please upgrade to continue reaching more hearts.`,
      code: 'LIMIT_REACHED'
    }, { status: 403 });
  }

  // Increment usage
  dbUser.usageCount += 1;
  await dbUser.save();
  
  // VERCEL-SAFE ARCHITECTURE:
  // We MUST await the AI analysis in the main request. 
  // Download/Upload will happen as a side-effect if time permits, 
  // but the 'Brain' work is secured first.
  
  try {
    // 1. Initial State
    await progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'loading', 
      message: '[Neural Pulse] Initializing Vesper Engine...' 
    });

    // 2. Await AI BRAIN
    await progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'loading', 
      message: '[Neural Pulse] Establishing Secure AI Handshake...' 
    });
    
    console.log(`[Engine] Starting Synchronous Analysis for ${jobId}`);
    const analysisResult = await runOpenAIPrimary(url, jobId);
    
    await progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'loading', 
      message: '[Neural Pulse] Spiritual Insights Harvested. Syncing to Sanctum...' 
    });

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
        finalPath: url, 
        analysis: analysisResult,
        createdAt: new Date()
      },
      { upsert: true }
    );

    await progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'loading', 
      message: '[Neural Pulse] Database Write Confirmed.' 
    });

    // 4. Update progress to reflect success
    await progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'completed', 
      message: `[Neural Pulse] Complete. GPT-4o generated ${analysisResult?.clips?.length || 0} clips.`,
      finalPath: url,
      analysis: analysisResult
    });

    // 5. Kick off download as a "Best Effort" background task
    runSermonPipeline(url, jobId, userId).catch(e => {
      console.error('[Engine] BG Pipeline Error:', e);
    });
    
    return NextResponse.json({ success: true, jobId });
  } catch (e: any) {
    const errorMsg = e.message || 'Unknown Neural Error';
    console.error('[Engine] Synchronous Failure:', e);
    
    // Log the EXACT error to the progress manager so the user sees it in the log
    await progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'error', 
      message: `[Neural Error] ${errorMsg}` 
    });

    return NextResponse.json({ 
      error: 'Neural Engine Failure', 
      details: errorMsg,
      code: e.code || '500' 
    }, { status: 500 });
  }
}
