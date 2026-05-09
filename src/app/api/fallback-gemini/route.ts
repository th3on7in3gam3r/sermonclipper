// src/app/api/fallback-gemini/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { progressManager } from '../../../lib/progress';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  let jobId = '';

  try {
    const { url, jobId: incomingJobId } = await req.json();
    jobId = incomingJobId || '';

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'loading', 
      message: 'Gemini AI is watching the sermon...' 
    });

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: { 
        temperature: 0.5,
        responseMimeType: "application/json"
      }
    });

    const prompt = `You are a professional sermon clip editor.

YouTube URL: ${url}

Return ONLY valid JSON with this structure:

{
  "success": true,
  "sermon_title": "Short powerful title",
  "main_theme": "One sentence theme",
  "clips": [
    {
      "start": 120,
      "end": 190,
      "hook_title": "Catchy title here",
      "main_quote": "Exact powerful quote",
      "suggested_captions": ["Caption line 1", "Line 2"]
    }
  ],
  "summary": "Short summary of the sermon"
}

Generate 6-10 strong clips.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (e) {
      console.error("JSON parse failed");
      parsed = { success: true, sermon_title: "Sermon Highlights", clips: [] };
    }

    progressManager.update(jobId, { 
      step: 'Analysis', 
      status: 'completed', 
      message: `✅ Generated ${parsed.clips?.length || 0} clips`,
      analysis: parsed
    });

    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (jobId) {
      progressManager.update(jobId, { 
        step: 'Analysis', 
        status: 'error', 
        message: error.message 
      });
    }
    return NextResponse.json({ 
      success: false, 
      clips: [], 
      message: error.message 
    });
  }
}
