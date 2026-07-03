import { join } from 'path';
import { existsSync, createWriteStream, createReadStream, unlinkSync } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import OpenAI from 'openai';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { progressManager } from '@/lib/progress';
import { isAudioMediaUrl } from '@/lib/mediaDetection';
import { uploadStreamToR2 } from '@/lib/r2';
import { TMP_DIR } from '@/lib/paths';
import { enrichAnalysisWithQuotes } from '@/lib/quotes/extractQuotables';

export type SermonContext = {
  manuscript?: string;
  preacherName?: string;
};

type AnalysisResult = {
  success?: boolean;
  sermon_title?: string;
  main_theme?: string;
  summary?: string;
  speaker?: string;
  source_type?: string;
  clips?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export class PlanLimitError extends Error {
  code = 'LIMIT_REACHED';

  constructor(message: string) {
    super(message);
    this.name = 'PlanLimitError';
  }
}

const MIRRORS = [
  { name: 'Cobalt Ghost (Elite)', type: 'cobalt', url: 'https://cobalt.tools/api/json' },
  { name: 'Clipper Global A', type: 'invidious', url: 'https://invidious.projectsegfau.lt' },
];

export function extractVideoId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  return m?.[1] ?? null;
}

async function resolveMirror(
  videoId: string,
  mirror: { name: string; type: string; url: string },
  fullUrl: string
): Promise<string | null> {
  try {
    if (mirror.type === 'cobalt') {
      const res = await fetch(mirror.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ url: fullUrl, videoQuality: '720' }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.url || null;
    }
    return null;
  } catch {
    return null;
  }
}

async function runOpenAIPrimary(url: string, context: SermonContext = {}): Promise<AnalysisResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY in Settings');
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const manuscriptBlock = context.manuscript
    ? `\n\nSERMON NOTES / MANUSCRIPT (use for section titles, clip hooks, and themes):\n${context.manuscript}`
    : '';
  const speakerBlock = context.preacherName
    ? `\n\nThe preacher/pastor for this sermon is: ${context.preacherName}. Set "speaker" in the JSON to this name.`
    : '';

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.5,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are a World-Class Ministry Content Strategist and Social Media Expert. Your goal is to harvest high-impact, spiritually provocative, and emotionally resonant segments for viral social media clips (Reels, TikToks, Shorts).',
      },
      {
        role: 'user',
        content: `Analyze this sermon: ${url}${manuscriptBlock}${speakerBlock}
        
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
          "speaker": "Pastor or preacher name if known",
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

        Generate 8-12 high-quality clips.`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(text) as AnalysisResult;
  if (context.preacherName && !parsed.speaker) {
    parsed.speaker = context.preacherName;
  }
  return parsed;
}

async function enforceUsageQuota(userId: string) {
  await connectDB();
  let dbUser = await User.findOne({ clerkId: userId });
  if (!dbUser) {
    dbUser = await User.create({ clerkId: userId, plan: 'free', usageCount: 0 });
  }

  const now = new Date();
  const resetDate = new Date(dbUser.lastUsageReset);
  if (now.getTime() - resetDate.getTime() > 30 * 24 * 60 * 60 * 1000) {
    dbUser.usageCount = 0;
    dbUser.lastUsageReset = now;
    await dbUser.save();
  }

  const limits: Record<string, number> = {
    free: 2,
    creator: 20,
    church_pro: 999999,
  };

  const limit = limits[dbUser.plan as string] || 2;
  if (dbUser.usageCount >= limit) {
    throw new PlanLimitError(
      `Your ${dbUser.plan} plan is limited to ${limit} clips per month. Please upgrade to continue.`
    );
  }

  dbUser.usageCount += 1;
  await dbUser.save();

  try {
    const { maybeSendQuotaEmails } = await import('@/lib/email/quotaTriggers');
    await maybeSendQuotaEmails(dbUser);
  } catch (err) {
    console.error('[sermonAnalysis] Quota email trigger failed:', err);
  }
}

/** Best-effort background download / mirror harvest after analysis completes. */
async function runSermonDownloadPipeline(
  url: string,
  jobId: string,
  userId: string,
  context: SermonContext,
  analysisResult: AnalysisResult
): Promise<void> {
  const filePath = join(TMP_DIR, `${jobId}.mp4`);

  await progressManager.update(jobId, {
    step: 'Downloading',
    status: 'loading',
    message: 'Engine: Harvesting media binary...',
  });

  let downloadSuccess = false;
  const vid = extractVideoId(url);

  if (!vid) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(300000) });
      if (res.ok && res.body) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await pipeline(Readable.fromWeb(res.body as any), createWriteStream(filePath));
        downloadSuccess = true;
      }
    } catch (err: unknown) {
      console.error('[Engine] Direct harvest failed:', err);
    }
  }

  if (!downloadSuccess && vid) {
    for (const m of MIRRORS) {
      const streamUrl = await resolveMirror(vid, m, url);
      if (!streamUrl) continue;
      try {
        const res = await fetch(streamUrl, { signal: AbortSignal.timeout(90000) });
        if (res.ok && res.body) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await pipeline(Readable.fromWeb(res.body as any), createWriteStream(filePath));
          downloadSuccess = true;
          break;
        }
      } catch {
        /* try next mirror */
      }
    }
  }

  if (downloadSuccess) {
    try {
      await progressManager.update(jobId, {
        step: 'Uploading',
        status: 'loading',
        message: 'Cloud Sync: Finalizing Media Kit...',
      });
      const r2Url = await uploadStreamToR2(`sermons/${jobId}.mp4`, createReadStream(filePath), 'video/mp4');
      await progressManager.update(jobId, {
        step: 'Downloading',
        status: 'completed',
        message: 'Master Download Complete',
        finalPath: r2Url,
        analysis: enrichAnalysisWithQuotes(analysisResult),
      });
      if (existsSync(filePath)) unlinkSync(filePath);
    } catch {
      await progressManager.update(jobId, {
        step: 'Downloading',
        status: 'completed',
        message: 'Analysis Ready (Download Sync Pending)',
        finalPath: url,
        analysis: enrichAnalysisWithQuotes(analysisResult),
      });
    }
  }
}

/** Run GPT analysis, persist sermon, and update job progress. */
export async function processSermonAnalysis(opts: {
  url: string;
  jobId: string;
  userId: string;
  context?: SermonContext;
}): Promise<void> {
  const { url, jobId, userId, context = {} } = opts;

  await enforceUsageQuota(userId);

  await progressManager.update(jobId, {
    step: 'Analysis',
    status: 'loading',
    message: '[Neural Pulse] Initializing Vesper Engine...',
  });

  await progressManager.update(jobId, {
    step: 'Analysis',
    status: 'loading',
    message: '[Neural Pulse] Establishing Secure AI Handshake...',
  });

  console.log(`[Engine] Starting analysis for ${jobId}`);
  const analysisResult = await runOpenAIPrimary(url, context);
  const isAudioSource = isAudioMediaUrl(url);
  if (isAudioSource && Array.isArray(analysisResult.clips)) {
    analysisResult.source_type = 'audio';
    analysisResult.clips = analysisResult.clips.map((c) => ({ ...c, is_audio: true }));
  }

  await progressManager.update(jobId, {
    step: 'Analysis',
    status: 'loading',
    message: '[Neural Pulse] Spiritual Insights Harvested. Syncing to Sanctum...',
  });

  const Sermon = (await import('@/models/Sermon')).default;
  await connectDB();

  const enrichedAnalysis = enrichAnalysisWithQuotes({
    ...analysisResult,
    speaker: analysisResult.speaker || context.preacherName || undefined,
  });

  await Sermon.findOneAndUpdate(
    { jobId },
    {
      userId,
      jobId,
      title: analysisResult.sermon_title || 'Untitled Sermon',
      mainTheme: analysisResult.main_theme || '',
      videoUrl: url,
      finalPath: url,
      manuscriptText: context.manuscript || '',
      analysis: enrichedAnalysis,
      createdAt: new Date(),
    },
    { upsert: true }
  );

  await progressManager.update(jobId, {
    step: 'Analysis',
    status: 'completed',
    message: `[Neural Pulse] Complete. GPT-4o generated ${analysisResult?.clips?.length || 0} clips.`,
    finalPath: url,
    analysis: enrichedAnalysis,
  });

  void runSermonDownloadPipeline(url, jobId, userId, context, analysisResult).catch((e) => {
    console.error('[Engine] BG download pipeline error:', e);
  });

  try {
    const { markChecklist } = await import('@/lib/checklist');
    const isYoutube = Boolean(extractVideoId(url));
    if (!isYoutube) await markChecklist(userId, 'uploadedSermon');
    await markChecklist(userId, 'createdClip');
  } catch {
    /* non-blocking */
  }

  try {
    const { recordClipGamification } = await import('@/lib/gamification');
    await recordClipGamification(userId);
  } catch {
    /* non-blocking */
  }
}
