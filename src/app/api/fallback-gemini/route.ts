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
      You are a professional church media strategist and short-form video editor.

      Analyze this full sermon video from YouTube and extract the most impactful moments.

      YouTube URL: ${url}

      Return only valid JSON using this exact structure:

      {
        "success": true,
        "sermon_title": "Short, powerful title suggestion",
        "main_theme": "One sentence main message",
        "clips": [
          {
            "start": 245,
            "end": 298,
            "hook_title": "Very catchy, curiosity-driven title",
            "main_quote": "The exact most powerful spoken words",
            "why_it_works": "Why this will engage people on social media",
            "suggested_captions": ["Bold line 1", "Line 2 that appears next", "Final line"]
          }
        ],
        "summary": "Powerful 2-3 sentence summary of the whole sermon",
        "key_verses": ["John 3:16", "Matthew 6:33"]
      }

      Rules:
      - Return 8–12 high-quality clips
      - Prioritize emotional, biblical, practical, or memorable moments
      - Make hook titles highly clickable
      - Timestamps must be accurate in seconds from the start of the video
      - Focus on content that works well as vertical Reels / Shorts
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const parsed = JSON.parse(text);

    progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'completed', 
      message: '✅ Gemini Analysis Successful' 
    });

    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error("🔥 GEMINI FALLBACK ERROR:", error);
    
    if (currentJobId) {
      progressManager.update(currentJobId, { 
        step: 'Analysis', 
        status: 'error', 
        message: `Gemini Analysis Failed: ${error.message}` 
      });
    }

    return NextResponse.json({ 
      error: "Gemini analysis failed", 
      message: error.message 
    }, { status: 500 });
  }
}
