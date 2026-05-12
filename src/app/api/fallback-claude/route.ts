import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { progressManager } from '../../../lib/progress';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

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
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set in Settings');

    // Token Shield: Check for cached analysis to save tokens
    const cached = await progressManager.get(jobId);
    if (cached?.analysis) {
      return NextResponse.json({ success: true, ...cached.analysis, analysis: cached.analysis });
    }

    progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'loading', 
      message: 'Claude 3.5 Sonnet analyzing sermon...' 
    });

    const prompt = `You are an expert sermon media editor.

YouTube URL: ${url}

Watch the full sermon and return **only valid JSON** with this structure:

{
  "success": true,
  "sermon_title": "Short powerful title",
  "main_theme": "One sentence theme",
  "clips": [
    {
      "start": 245,
      "end": 298,
      "hook_title": "Very catchy title",
      "main_quote": "Exact powerful quote",
      "suggested_captions": ["Caption line 1", "Line 2", "Line 3"]
    }
  ],
  "summary": "Powerful 2-3 sentence summary"
}

Generate 8-12 high-quality clips. Focus on impactful, emotional, and biblical moments.`;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 4000,
      temperature: 0.5,
      messages: [{ role: "user", content: prompt }]
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      parsed = { success: true, sermon_title: "Sermon Highlights", clips: [] };
    }

    progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'completed', 
      message: `✅ Claude generated ${parsed.clips?.length || 0} clips`,
      analysis: parsed
    });

    return NextResponse.json({
      success: true,
      ...parsed,
      analysis: parsed
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Claude analysis failed';
    console.error("Claude Error:", error);
    if (jobId) {
      progressManager.update(jobId, { step: 'Analysis', status: 'error', message: msg });
    }
    return NextResponse.json({ success: false, clips: [], message: msg });
  }
}
