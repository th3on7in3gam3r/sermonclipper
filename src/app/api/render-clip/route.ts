import { NextRequest, NextResponse } from 'next/server';
import { progressManager } from '../../../lib/progress';

const SHOTSTACK_SANDBOX_KEY = process.env.SHOTSTACK_SANDBOX_KEY;
const SHOTSTACK_PRODUCTION_KEY = process.env.SHOTSTACK_PRODUCTION_KEY;

// Smart Switch: Use production if sandbox is missing, or vice versa
const SHOTSTACK_API_KEY = SHOTSTACK_PRODUCTION_KEY || SHOTSTACK_SANDBOX_KEY;
const IS_PRODUCTION = !!SHOTSTACK_PRODUCTION_KEY && !SHOTSTACK_SANDBOX_KEY;
const SHOTSTACK_URL = IS_PRODUCTION 
  ? 'https://api.shotstack.io/edit/v1/render' 
  : 'https://api.shotstack.io/edit/stage/render';

// Robust time parser for MM:SS or raw seconds
const parseTime = (timeVal: any): number => {
  if (typeof timeVal === 'number') return timeVal;
  if (!timeVal) return 0;
  const str = String(timeVal);
  if (str.includes(':')) {
    const parts = str.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }
  return parseFloat(str) || 0;
};

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
    const start = parseTime(clip.start);
    const end = parseTime(clip.end);
    const duration = Math.max(end - start, 1); // Ensure at least 1s duration

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
