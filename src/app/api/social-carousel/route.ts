import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { progressManager } from '../../../lib/progress';

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const state = await progressManager.get(jobId);
    if (!state || !state.analysis) {
      return NextResponse.json({ error: 'Sermon analysis not found.' }, { status: 404 });
    }

    const analysis = state.analysis;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are an expert Social Media Manager for a modern church.
Your task is to take the provided sermon analysis and create a highly engaging, 5-slide Instagram/Facebook Text Carousel.
The carousel should break down the main theme of the sermon into bite-sized, shareable insights.

Return ONLY a strictly valid JSON object in this exact format:
{
  "slides": [
    { "slide_number": 1, "heading": "Catchy Hook Title", "content": "Short hook text" },
    { "slide_number": 2, "heading": "Point 1", "content": "Insight from the sermon" },
    { "slide_number": 3, "heading": "Point 2", "content": "Insight from the sermon" },
    { "slide_number": 4, "heading": "Point 3", "content": "Insight from the sermon" },
    { "slide_number": 5, "heading": "Call to Action", "content": "Save this post and share it!" }
  ],
  "post_caption": "A well-written caption for the actual Instagram post, including relevant emojis and 5-7 popular hashtags."
}

Ensure the content is uplifting, inspiring, and easy to read.`;

    const userMessage = `Sermon Title: ${analysis.sermon_title || 'Untitled'}
Main Theme: ${analysis.main_theme || 'Sermon'}
Summary: ${analysis.summary || ''}

Please generate the carousel JSON.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);

  } catch (error: unknown) {
    console.error('[Social Carousel] API Error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to generate carousel';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
