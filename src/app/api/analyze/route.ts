export const bodyParser = {
  sizeLimit: '100mb',
};

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { progressManager } from '@/lib/progress';

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[Analyze] Full request body:', JSON.stringify(body, null, 2));
    const { transcription, jobId, branding } = body;
    console.log('[Analyze] Received request for jobId:', jobId);
    console.log('[Analyze] Branding:', branding);
    console.log('[Analyze] Transcription text length:', transcription?.text?.length);

    if (!transcription) {
      return NextResponse.json({ error: 'No transcription provided' }, { status: 400 });
    }

    progressManager.update(jobId, { 
      step: 'Analyzing', 
      status: 'loading', 
      message: 'Generating your complete Sermon Clipper Suite...' 
    });

    const transcriptText = transcription.text || JSON.stringify(transcription);

    const systemPrompt = `You are a professional church media producer compiling a complete Sermon Clipper Suite package from a long sermon (45–90 minutes).

The user has provided:
- Full merged transcript (possibly created from multiple audio chunks)
- Chosen template: ${branding.template || 'Modern Cinematic'}
- Primary Color: ${branding.primaryColor || '#8b5cf6'}
- Accent Color: ${branding.accentColor || '#d946ef'}
- Church Logo Description: ${branding.logoDescription || 'A subtle, modern cross icon'}
- Edited transcription (if any changes were made)

Your task:
1. Carefully read the entire transcript.
2. Identify the strongest moments across the full sermon.
3. Generate a complete, high-quality package.

Return a JSON object with these top-level keys: sermon_info, sermon_clips, sermon_images, quotes_and_verses, summaries, five_day_devotional, social_captions.

Important Rules:
- Prioritize the most impactful, emotionally strong, or biblically rich moments from the entire sermon.
- All image prompts MUST incorporate the user's branding colors, logo description, chosen template style, and fonts.
- Timestamps must be in total seconds from the start of the full sermon.
- Aim for 8–12 sermon clips.
- Make everything self-contained and ready to post.

Begin processing now.`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Here is the sermon transcript: ${transcriptText}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    console.log('[Analyze] OpenAI response content length:', content?.length);
    console.log('[Analyze] OpenAI response content preview:', content?.substring(0, 500));

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    let data;
    try {
      data = JSON.parse(content);
    } catch (parseErr: unknown) {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      console.error('[Analyze] JSON parse error:', msg);
      console.error('[Analyze] Raw content:', content);
      throw new Error(`Failed to parse OpenAI response: ${msg}`);
    }
    
    // Map new structure to expected format
    let mappedData;
    try {
      mappedData = {
        summaries: data.summaries,
        main_theme: data.sermon_info?.main_theme,
        tone: data.sermon_info?.tone,
        five_day_devotional: data.five_day_devotional || [],
        clips: (data.sermon_clips || []).map((clip: Record<string, unknown>) => ({
          clip_number: clip.clip_number,
          start_time: clip.start,
          end_time: clip.end,
          duration: clip.duration,
          hook_title: clip.hook_title,
          main_quote: clip.main_quote,
          why_it_works: clip.why_it_works,
          hashtags: clip.hashtags
        })),
        social_captions: (data.social_captions || []).map((cap: Record<string, unknown>) => ({
          clip_number: cap.clip_number,
          captions: [cap.instagram_caption, cap.tiktok_caption].filter(Boolean)
        })),
        sermon_images: data.sermon_images || [],
        quotes_and_verses: data.quotes_and_verses || []
      };
      console.log('[Analyze] Mapped data successfully');
    } catch (mapErr: unknown) {
      const msg = mapErr instanceof Error ? mapErr.message : String(mapErr);
      console.error('[Analyze] Mapping error:', msg);
      throw new Error(`Failed to map response data: ${msg}`);
    }
    
    progressManager.update(jobId, { 
      step: 'Analyzing', 
      status: 'completed', 
      message: 'Analysis complete' 
    });

    return NextResponse.json({ 
      success: true, 
      ...mappedData
    });
  } catch (error: unknown) {
    console.error('Analysis error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
