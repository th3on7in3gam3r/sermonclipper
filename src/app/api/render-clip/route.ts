import { NextRequest, NextResponse } from 'next/server';
import { progressManager } from '../../../lib/progress';

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_SANDBOX_KEY || process.env.SHOTSTACK_PRODUCTION_KEY;
const SHOTSTACK_URL = 'https://api.shotstack.io/edit/stage/render'; // Using Sandbox for safety

export async function POST(req: NextRequest) {
  try {
    const { jobId, clip, index } = await req.json();
    
    if (!jobId || !clip) {
      return NextResponse.json({ error: 'Missing jobId or clip data' }, { status: 400 });
    }

    const state = progressManager.get(jobId);
    if (!state || !state.finalPath) {
      return NextResponse.json({ error: 'Master video not ready. Please wait.' }, { status: 404 });
    }

    const videoUrl = state.finalPath;
    const start = parseFloat(clip.start);
    const duration = parseFloat(clip.end) - start;

    // Shotstack JSON Payload
    const shotstackEdit = {
      timeline: {
        tracks: [
          {
            clips: [
              {
                asset: {
                  type: 'video',
                  src: videoUrl,
                  trim: start
                },
                start: 0,
                length: duration,
                fit: 'cover',
                scale: 1
              }
            ]
          },
          {
            clips: (clip.suggested_captions || []).map((text: string, i: number) => ({
              asset: {
                type: 'text',
                text: text.toUpperCase(),
                font: {
                  family: 'Montserrat',
                  size: 48,
                  weight: 'black',
                  color: '#FFFF00'
                },
                alignment: {
                  horizontal: 'center',
                  vertical: 'center'
                },
                offset: {
                  y: -0.2
                }
              },
              start: i * (duration / (clip.suggested_captions.length || 1)),
              length: duration / (clip.suggested_captions.length || 1),
              transition: {
                in: 'fade'
              }
            }))
          }
        ]
      },
      output: {
        format: 'mp4',
        resolution: 'hd',
        aspectRatio: '9:16'
      }
    };

    console.log('[Shotstack] Sending Render Request...');
    const response = await fetch(SHOTSTACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SHOTSTACK_API_KEY || ''
      },
      body: JSON.stringify(shotstackEdit)
    });

    const data = await response.json();

    if (data.success) {
      console.log('[Shotstack] Render queued:', data.response.id);
      return NextResponse.json({ 
        success: true, 
        shotstackId: data.response.id,
        status: 'queued'
      });
    } else {
      console.error('[Shotstack] API Error:', data.message);
      return NextResponse.json({ error: data.message || 'Shotstack failed' }, { status: 500 });
    }

  } catch (e: any) {
    console.error('[Render Engine] Critical Failure:', e);
    return NextResponse.json({ error: e.message || 'Render pipeline failed' }, { status: 500 });
  }
}
