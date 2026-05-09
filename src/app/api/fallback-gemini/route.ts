import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { progressManager } from '../../../lib/progress';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { url, jobId } = await req.json();
    if (!url || !jobId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in environment.');
    }

    progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'loading', 
      message: 'Activating Gemini God-Mode (Deep YouTube Analysis)...' 
    });

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: { 
        temperature: 0.4,
        responseMimeType: "application/json"
      }
    });

    const prompt = `
      You are a professional sermon media editor.
      Analyze this full sermon video and identify the most powerful moments for social media clips.
      
      YouTube URL: ${url}

      Return a JSON object with:
      {
        "success": true,
        "summary": "Short powerful summary of the sermon",
        "main_theme": "Primary spiritual theme",
        "clips": [
          {
            "start": number (seconds),
            "end": number (seconds),
            "hook_title": "Catchy title for the clip",
            "main_quote": "The most powerful quote in this section",
            "suggested_captions": ["caption 1", "caption 2"]
          }
        ]
      }
    `;

    // Note: In 1.5 Pro, providing the URL in the prompt is often enough for the model 
    // to access its internal YouTube indexing if the video is public.
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
    progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'error', 
      message: `Gemini Fallback Failed: ${error.message}` 
    });

    return NextResponse.json({ 
      error: "Gemini fallback failed", 
      message: error.message 
    }, { status: 500 });
  }
}
