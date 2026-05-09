import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { progressManager } from '../../../lib/progress';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  let currentJobId = '';

  try {
    const { url, jobId } = await req.json();
    currentJobId = jobId;

    if (!url || !jobId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'loading', 
      message: 'Analyzing sermon with Gemini AI...' 
    });

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: { 
        temperature: 0.5,
        responseMimeType: "application/json"
      }
    });

    const prompt = `
      You are an expert sermon clip editor for social media.

      YouTube URL: ${url}

      Carefully watch the full sermon and return ONLY valid JSON (no explanations, no markdown, no extra text).

      Use this exact structure:
      {
        "success": true,
        "sermon_title": "Short powerful title",
        "main_theme": "One sentence theme",
        "clips": [
          {
            "start": 123,
            "end": 180,
            "hook_title": "Catchy clickable title",
            "main_quote": "Exact powerful quote",
            "why_it_works": "Why this clip is good",
            "suggested_captions": ["Line 1", "Line 2", "Line 3"]
          }
        ],
        "summary": "Short powerful summary",
        "key_verses": ["John 3:16", "Genesis 1:1"]
      }

      Generate 8 to 12 high-quality clips. Focus on the strongest moments.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (e) {
      console.error("JSON Parse Failed, raw text:", text);
      parsed = { success: true, sermon_title: "Sermon Highlights", clips: [], main_theme: "Analysis Pending" };
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
    console.error("🔥 GEMINI FALLBACK ERROR:", error);
    
    if (currentJobId) {
      progressManager.update(currentJobId, { 
        step: 'Analysis', 
        status: 'error', 
        message: `Gemini failed: ${error.message}` 
      });
    }

    return NextResponse.json({ 
      success: false,
      error: "Gemini analysis failed", 
      message: error.message,
      clips: []
    }, { status: 500 });
  }
}

// Polling-friendly retrieval
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');
  if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  
  const update = progressManager.get(jobId);
  
  // Return 200 even if not found to keep the console clean during polling
  if (update?.analysis) {
    return NextResponse.json({
      success: true,
      ...update.analysis,
      analysis: update.analysis
    });
  }
  
  return NextResponse.json({ 
    success: false, 
    status: 'pending',
    message: 'Neural analysis still in progress...' 
  });
}
