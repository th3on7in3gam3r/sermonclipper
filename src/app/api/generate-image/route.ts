import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });
    }

    console.log('[DALL-E] Generating image for prompt:', prompt);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1792", // Vertical 9:16 approx
      quality: "standard",
    });

    if (!response.data || !response.data[0] || !response.data[0].url) {
      return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
    }

    const imageUrl = response.data[0].url;

    return NextResponse.json({ 
      success: true, 
      imageUrl 
    });
  } catch (error: unknown) {
    console.error('DALL-E error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
