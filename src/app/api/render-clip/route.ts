import { NextRequest, NextResponse } from 'next/server';
import { progressManager } from '../../../lib/progress';
import { resolveShotstackVideoUrl } from '../../../lib/shotstackVideoUrl';
import { isDownloadableMasterUrl, isYouTubeUrl } from '../../../lib/videoSource';

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
  // Shotstack text asset supports a limited set of built-in fonts.
  // Use exact names to avoid silent fallback to the default font.
  outfit: 'Montserrat ExtraBold',
  impact: 'Montserrat SemiBold',
  georgia: 'Open Sans Bold',
  mono: 'Open Sans Regular',
  serif: 'Clear Sans',
};

// Map animation id → Shotstack transition (must match API allowed values)
const ANIMATION_MAP: Record<string, string> = {
  fade: 'fade',
  slideUp: 'slideUp',
  zoom: 'zoom',
  carve: 'reveal',
};

// Map filter id → Shotstack filter (must match API allowed values)
const FILTER_MAP: Record<string, string> = {
  vintage: 'contrast',
  cold: 'muted',
  warm: 'boost',
  noir: 'greyscale',
  glory: 'boost',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, clip, template, filter, font, animation, videoUrl: bodyVideoUrl } = body;

    if (!jobId || !clip) {
      return NextResponse.json({ error: 'Missing jobId or clip data' }, { status: 400 });
    }

    const state = await progressManager.get(jobId);
    const resolvedVideoUrl = state?.finalPath || bodyVideoUrl;

    console.log('[Render] State finalPath:', state?.finalPath, 'bodyVideoUrl:', bodyVideoUrl);

    if (!resolvedVideoUrl || !isDownloadableMasterUrl(resolvedVideoUrl)) {
      return NextResponse.json(
        {
          error:
            'Master video not ready. Wait for upload to finish, then refresh the results page before exporting.',
        },
        { status: 404 }
      );
    }

    if (isYouTubeUrl(resolvedVideoUrl)) {
      return NextResponse.json(
        {
          error:
            'Video rendering requires a direct MP4 file. The YouTube download did not complete successfully. Please try uploading the video file directly instead.',
        },
        { status: 400 }
      );
    }

    if (!SHOTSTACK_API_KEY) {
      return NextResponse.json(
        {
          error:
            'Video rendering is not configured. Please add SHOTSTACK_SANDBOX_KEY or SHOTSTACK_PRODUCTION_KEY to your environment variables.',
        },
        { status: 503 }
      );
    }

    let shotstackVideoUrl: string;
    try {
      shotstackVideoUrl = await resolveShotstackVideoUrl(resolvedVideoUrl);
      console.log('[Render] Shotstack source URL ready');
    } catch (urlError) {
      console.error('[Render] Failed to prepare video URL for Shotstack:', urlError);
      return NextResponse.json(
        {
          error:
            'Could not prepare your uploaded video for cloud rendering. Check R2 storage credentials and try again.',
        },
        { status: 502 }
      );
    }

    if (!state?.finalPath && bodyVideoUrl) {
      await progressManager.update(jobId, {
        step: 'Render',
        status: 'loading',
        finalPath: bodyVideoUrl,
      });
    }

    const videoUrl = resolvedVideoUrl;
    const start = parseTime(clip.start);
    const end = parseTime(clip.end);
    const duration = Math.max(end - start, 1);

    const captionColor = TEMPLATE_COLORS[template] || '#FFFFFF';
    const fontFamily = FONT_FAMILIES[font] || 'Montserrat';
    const transitionIn = ANIMATION_MAP[animation] || 'fade';

    const captions = (clip.suggested_captions || [])
      .map((text: string) => String(text || '').trim())
      .filter(Boolean);

    const fallbackCaption = String(clip.main_quote || clip.hook_title || 'SERMON HIGHLIGHT').trim();
    const captionLines = captions.length > 0 ? captions : [fallbackCaption];
    const captionDuration = captionLines.length > 0 ? duration / captionLines.length : duration;

    // Build caption clips
    const captionClips = captionLines.map((text: string, i: number) => ({
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
      const audioCaptionClips = captionLines.map((text: string, i: number) => ({
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
        const shotstackFilter = FILTER_MAP[filter];
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

    const raw = await response.text();
    let data: { success?: boolean; response?: { id?: string }; message?: string; error?: string };
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      console.error('[Shotstack] Non-JSON response:', raw.slice(0, 500));
      return NextResponse.json(
        { error: `Shotstack returned an unexpected response (${response.status}). Check server logs.` },
        { status: 502 }
      );
    }

    if (data.success && data.response?.id) {
      console.log('[Shotstack] Render queued:', data.response.id);
      return NextResponse.json({
        success: true,
        shotstackId: data.response.id,
        status: 'queued',
      });
    }

    const shotstackError =
      data.message ||
      data.error ||
      (typeof data === 'object' ? JSON.stringify(data) : raw) ||
      `Shotstack request failed (${response.status})`;

    console.error('[Shotstack] API Error:', shotstackError);
    console.error('[Shotstack] Payload sent:', JSON.stringify(shotstackEdit));

    return NextResponse.json({ error: shotstackError }, { status: response.ok ? 500 : response.status || 500 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Render pipeline failed';
    console.error('[Render Engine] Critical Failure:', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
