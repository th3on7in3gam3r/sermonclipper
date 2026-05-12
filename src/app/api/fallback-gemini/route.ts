import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { progressManager } from '../../../lib/progress';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');
  if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  
  const update = await progressManager.get(jobId);
  if (update?.analysis) {
    return NextResponse.json({
      success: true,
      ...update.analysis,
      analysis: update.analysis
    });
  }
  
  return NextResponse.json({ success: false, status: 'pending' });
}

export async function POST(req: NextRequest) {
  let jobId = '';

  try {
    const { url, jobId: incomingJobId } = await req.json();
    jobId = incomingJobId || '';

    if (!url) return NextResponse.json({ error: 'No URL' }, { status: 400 });
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set in Settings');

    progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'loading', 
      message: 'Gemini analyzing sermon...' 
    });

    // Most reliable and lightweight model call
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    const prompt = `You are a World-Class Ministry Content Strategist and Social Media Expert. 
      Analyze this YouTube sermon: ${url}
      
      Your goal is to "Harvest" the most high-impact, spiritually provocative, and emotionally resonant segments for viral social media clips (Reels, TikToks, Shorts).

      CRITICAL SELECTION CRITERIA:
      1. THE MIC DROP: Find moments where the speaker makes a definitive, life-changing point.
      2. THE HOOK: Ensure the clip starts with a strong statement or a provocative question.
      3. DURATION: Prioritize clips between 35 and 58 seconds.
      4. THEOLOGICAL CORE: Each clip must contain a complete thought or theological point.

      Return ONLY valid JSON in this format:
      {
        "success": true,
        "sermon_title": "Cinematic Sermon Title",
        "main_theme": "The deep spiritual core of this message",
        "summary": "A 3-sentence theological summary for the description box",
        "clips": [
          {
            "start": 120,
            "end": 175,
            "hook_title": "The Truth About [Topic]", 
            "main_quote": "The most powerful sentence in this clip",
            "suggested_captions": ["Short, punchy line 1", "Short, punchy line 2"],
            "viral_score": 95,
            "engagement_hook": "Why this clip will stop the scroll"
          }
        ]
      }

      Return 8-12 high-quality clips.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let parsed;
    try {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : text);
    } catch {
      parsed = { success: true, sermon_title: "Sermon", clips: [] };
    }

    progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'completed', 
      message: `✅ Generated ${parsed.clips?.length || 0} clips`,
      analysis: parsed
    });

    return NextResponse.json({
      success: true,
      ...parsed,
      analysis: parsed
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gemini analysis failed';
    console.error("Gemini Error:", error);
    if (jobId) {
      progressManager.update(jobId, { step: 'Analysis', status: 'error', message: msg });
    }
    return NextResponse.json({ success: false, clips: [], message: msg });
  }
}
