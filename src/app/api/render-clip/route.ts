import { NextRequest, NextResponse } from 'next/server';
import { progressManager } from '../../../lib/progress';
import { generatePresignedGetUrl } from '../../../lib/r2';

const SHOTSTACK_SANDBOX_KEY = process.env.SHOTSTACK_SANDBOX_KEY;
const SHOTSTACK_PRODUCTION_KEY = process.env.SHOTSTACK_PRODUCTION_KEY;

// Always pair the key with its matching endpoint
// If both are set, prefer sandbox for safety
const SHOTSTACK_API_KEY = SHOTSTACK_SANDBOX_KEY || SHOTSTACK_PRODUCTION_KEY;
const SHOTSTACK_URL = SHOTSTACK_SANDBOX_KEY
  ? 'https://api.shotstack.io/edit/stage/render'
  : 'https://api.shotstack.io/edit/v1/render';

const parseTime = (timeVal: unknown): number => {
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

// Map template id → caption color
const TEMPLATE_COLORS: Record<string, string> = {
  minimal: '#FFFFFF',
  cinematic: '#FFFF00',
  modern: '#C4B5FD',
  fire: '#FCD34D',
};

// Map font id → Shotstack font family
const FONT_FAMILIES: Record<string, string> = {
  outfit: 'Montserrat',
  impact: 'Anton',
  georgia: 'Merriweather',
  mono: 'Source Code Pro',
  serif: 'Playfair Display',
};

// Map animation id → Shotstack transition
const ANIMATION_MAP: Record<string, string> = {
  fade: 'fade',
  slideUp: 'slideUp',
  zoom: 'zoom',
  carve: 'carve',
};

// Map filter id → Shotstack effect (lut / color correction)
// Shotstack doesn't have a direct CSS filter, so we use color correction clips
const FILTER_EFFECTS: Record<string, Record<string, number> | null> = {
  none: null,
  vintage: { brightness: -0.05, contrast: 0.15, saturation: -0.3 },
  cold: { saturation: -0.6, brightness: 0.1 },
  warm: { saturation: 0.4, brightness: 0.05 },
  noir: { saturation: -1, contrast: 0.3 },
  glory: { brightness: 0.15, saturation: 0.3 },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, clip, template, filter, font, animation } = body;

    if (!jobId || !clip) {
      return NextResponse.json({ error: 'Missing jobId or clip data' }, { status: 400 });
    }

    const state = await progressManager.get(jobId);
    console.log('[Render] State finalPath:', state?.finalPath);
    if (!state || !state.finalPath) {
      return NextResponse.json({ error: 'Master video not ready. Please wait for the download to complete.' }, { status: 404 });
    }

    const videoUrl = state.finalPath;

    // If the video is stored in R2 (private), generate a presigned GET URL
    // so Shotstack can fetch it. R2 objects are private by default.
    let shotstackVideoUrl = videoUrl;
    if (videoUrl.includes('.r2.cloudflarestorage.com')) {
      try {
        const urlObj = new URL(videoUrl);
        const decodedPath = decodeURIComponent(urlObj.pathname);
        const pathParts = decodedPath.split('/').filter(Boolean);
        const key = pathParts.slice(1).join('/');
        console.log('[Render] Extracted R2 key:', key);
        shotstackVideoUrl = await generatePresignedGetUrl(key, 7200);
        console.log('[Render] Presigned URL generated OK');
      } catch (e) {
        console.error('[Render] Presigned URL generation failed:', e);
        shotstackVideoUrl = videoUrl;
      }
    }
    const isYouTubeUrl = shotstackVideoUrl.includes('youtube.com') || shotstackVideoUrl.includes('youtu.be');
    if (isYouTubeUrl) {
      return NextResponse.json({ 
        error: 'Video rendering requires a direct MP4 file. The YouTube download did not complete successfully. Please try uploading the video file directly instead.' 
      }, { status: 400 });
    }

    if (!SHOTSTACK_API_KEY) {
      return NextResponse.json({ 
        error: 'Video rendering is not configured. Please add SHOTSTACK_SANDBOX_KEY or SHOTSTACK_PRODUCTION_KEY to your environment variables.' 
      }, { status: 503 });
    }
    const start = parseTime(clip.start);
    const end = parseTime(clip.end);
    const duration = Math.max(end - start, 1);

    const captionColor = TEMPLATE_COLORS[template] || '#FFFFFF';
    const fontFamily = FONT_FAMILIES[font] || 'Montserrat';
    const transitionIn = ANIMATION_MAP[animation] || 'fade';

    const captions = clip.suggested_captions || [];
    const captionDuration = captions.length > 0 ? duration / captions.length : duration;

    // Build caption clips
    const captionClips = captions.map((text: string, i: number) => ({
      asset: {
        type: 'text',
        text: text.toUpperCase(),
        font: {
          family: fontFamily,
          size: 80,
          color: captionColor,
        },
      },
      width: 1080,
      height: 200,
      start: i * captionDuration,
      length: captionDuration,
      position: 'bottom',
      transition: { in: transitionIn, out: 'fade' },
    }));

    const isAudio = videoUrl.match(/\.(mp3|m4a|wav|aac|ogg|flac|wma|mp4a|m4b)($|\?)/i) || 
                    videoUrl.toLowerCase().includes('audio');

    let tracks: any[] = [];

    if (isAudio) {
      // Build title overlay clip at the top
      const titleClip = {
        asset: {
          type: 'text',
          text: (clip.hook_title || 'SERMON FOCUS').toUpperCase(),
          font: {
            family: fontFamily,
            size: 32,
            color: '#8B5CF6', // Purple brand accent
          },
        },
        width: 900,
        height: 100,
        start: 0,
        length: duration,
        position: 'top',
        transition: { in: 'fade', out: 'fade' },
      };

      // Caption clips positioned centered for gorgeous podcast reel aesthetic
      const audioCaptionClips = captions.map((text: string, i: number) => ({
        asset: {
          type: 'text',
          text: text.toUpperCase(),
          font: {
            family: fontFamily,
            size: 56,
            color: captionColor,
          },
        },
        width: 1000,
        height: 300,
        start: i * captionDuration,
        length: captionDuration,
        position: 'center',
        transition: { in: transitionIn, out: 'fade' },
      }));

      // Background Image Clip - beautiful deep violet abstract 3D artwork from Unsplash
      const bgClip = {
        asset: {
          type: 'image',
          src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&q=80',
        },
        start: 0,
        length: duration,
        fit: 'cover',
      };

      // Audio track clip
      const audioClip = {
        asset: {
          type: 'audio',
          src: shotstackVideoUrl,
          trim: start,
        },
        start: 0,
        length: duration,
      };

      tracks = [
        // Layer 1: Captions (Topmost)
        ...(audioCaptionClips.length > 0 ? [{ clips: audioCaptionClips }] : []),
        // Layer 2: Sermon Title Accent
        { clips: [titleClip] },
        // Layer 3: Main background card
        { clips: [bgClip] },
        // Layer 4: Audio track
        { clips: [audioClip] },
      ];
    } else {
      // Build video clip
      const videoClip: Record<string, unknown> = {
        asset: { type: 'video', src: shotstackVideoUrl, trim: start },
        start: 0,
        length: duration,
        fit: 'cover',
      };

      // Apply color filter if selected (Shotstack filter property on clip)
      if (filter && filter !== 'none') {
        const filterMap: Record<string, string> = {
          vintage: 'contrast',
          cold: 'muted',
          warm: 'boost',
          noir: 'greyscale',
          glory: 'enhance',
        };
        const shotstackFilter = filterMap[filter];
        if (shotstackFilter) videoClip.filter = shotstackFilter;
      }

      tracks = [
        // Captions on top (first track = topmost layer in Shotstack)
        ...(captionClips.length > 0 ? [{ clips: captionClips }] : []),
        { clips: [videoClip] },
      ];
    }

    const shotstackEdit = {
      timeline: {
        tracks,
      },
      output: {
        format: 'mp4',
        resolution: 'hd',
        aspectRatio: '9:16',
      },
    };

    console.log(`[Shotstack] Render: template=${template}, filter=${filter}, font=${font}, animation=${animation}, duration=${duration}s`);

    const response = await fetch(SHOTSTACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SHOTSTACK_API_KEY || '',
      },
      body: JSON.stringify(shotstackEdit),
    });

    const data = await response.json();

    if (data.success) {
      console.log('[Shotstack] Render queued:', data.response.id);
      return NextResponse.json({
        success: true,
        shotstackId: data.response.id,
        status: 'queued',
      });
    } else {
      console.error('[Shotstack] API Error:', JSON.stringify(data));
      console.error('[Shotstack] Payload sent:', JSON.stringify(shotstackEdit));
      return NextResponse.json({ error: data.message || data.error || JSON.stringify(data) }, { status: 500 });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Render pipeline failed';
    console.error('[Render Engine] Critical Failure:', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
