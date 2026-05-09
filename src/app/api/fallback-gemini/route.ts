import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { progressManager } from '../../../lib/progress';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');
  if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  
  const update = progressManager.get(jobId);
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

    // Check for cached analysis to save tokens
    const cached = progressManager.get(jobId);
    if (cached?.analysis) {
      return NextResponse.json(cached.analysis);
    }

    progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'loading', 
      message: 'Gemini AI analyzing sermon...' 
    });

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro-latest",        // ← Fixed Model Name
      generationConfig: { 
        temperature: 0.5,
        responseMimeType: "application/json"
      }
    });

    const prompt = `You are a professional sermon clip editor.

      YouTube URL: ${url}

      Return ONLY valid JSON:

      {
        "success": true,
        "sermon_title": "Short powerful title",
        "main_theme": "One sentence theme",
        "clips": [
          {
            "start": 120,
            "end": 190,
            "hook_title": "Catchy title",
            "main_quote": "Exact powerful quote",
            "suggested_captions": ["Line 1", "Line 2"]
          }
        ],
        "summary": "Short powerful summary"
      }

      Generate 6-10 strong clips.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (e) {
      console.error("JSON Parse Failed:", e);
      parsed = { success: true, sermon_title: "Sermon Highlights", clips: [] };
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

  } catch (error: any) {
    console.error("Gemini Error:", error);
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
