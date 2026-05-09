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

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in environment.');
    }

    progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'loading', 
      message: 'Neural Engine: Harvesting viral spiritual moments...' 
    });

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: { 
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    });

    const prompt = `
      You are a professional church media editor specializing in turning sermons into viral short-form content.

      Analyze the full sermon video from this YouTube URL:
      ${url}

      Return ONLY valid JSON with this exact structure:
      {
        "success": true,
        "sermon_title": "Suggested short title",
        "main_theme": "One sentence theme",
        "clips": [
          {
            "start": 123,
            "end": 178,
            "hook_title": "Very catchy, curiosity-driven title",
            "main_quote": "The most powerful exact quote from the sermon",
            "why_it_works": "Brief reason why this clip will perform well",
            "suggested_captions": ["Bold line 1", "Line 2", "Line 3"]
          }
        ],
        "summary": "Powerful 2-3 sentence summary",
        "key_verses": ["John 3:16", "Psalm 23:1"]
      }

      Rules:
      - Prioritize emotionally strong, biblically rich, or practically useful moments.
      - Aim for 6–10 high-quality clips.
      - Timestamps must be accurate in seconds.
      - Make hook titles highly clickable for social media.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const parsed = JSON.parse(text);

    progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'completed', 
      message: 'Gemini Analysis Successful' 
    });

    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error("🔥 GEMINI FALLBACK ERROR:", error);
    
    if (currentJobId) {
      progressManager.update(currentJobId, { 
        step: 'Analysis', 
        status: 'error', 
        message: `Gemini Fallback Failed: ${error.message}` 
      });
    }

    return NextResponse.json({ 
      error: "Gemini fallback failed", 
      message: error.message 
    }, { status: 500 });
  }
}
