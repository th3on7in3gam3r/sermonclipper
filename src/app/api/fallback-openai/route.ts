import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { progressManager } from '../../../lib/progress';

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

    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured in environment variables');
    }

    // Token Shield: Check for cached analysis to save tokens
    const cached = await progressManager.get(jobId);
    if (cached?.analysis) {
      return NextResponse.json({ success: true, ...cached.analysis, analysis: cached.analysis });
    }

    progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'loading', 
      message: 'GPT-4o analyzing sermon...' 
    });

    // Lazy initialize inside the request (fixes Next.js build error)
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
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      parsed = { success: true, sermon_title: "Sermon Highlights", clips: [] };
    }

    progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'completed', 
      message: `✅ GPT-4o generated ${parsed.clips?.length || 0} clips`,
      analysis: parsed
    });

    return NextResponse.json({
      success: true,
      ...parsed,
      analysis: parsed
    });

  } catch (error: any) {
    console.error("OpenAI Error:", error);
    if (jobId) {
      progressManager.update(jobId, { 
        step: 'Analysis', 
        status: 'error', 
        message: error.message 
      });
    }
    return NextResponse.json({ success: false, clips: [], message: error.message });
  }
}
