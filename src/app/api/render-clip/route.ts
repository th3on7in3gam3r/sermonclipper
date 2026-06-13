import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { progressManager } from '../../../lib/progress';
import { planAllowsExport } from '@/lib/plans';
import { effectivePlan } from '@/lib/adminBypass';
import { getShotstackConfig, mapShotstackHttpError, parseShotstackErrorBody } from '@/lib/shotstack';
import { resolveShotstackVideoUrl } from '../../../lib/shotstackVideoUrl';
import { isDownloadableMasterUrl, isYouTubeUrl } from '../../../lib/videoSource';
import { isAudioMediaUrl } from '@/lib/mediaDetection';

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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Sign in to export reels.' }, { status: 401 });
    }

    const clerkUser = await currentUser();

    await connectDB();
    const dbUser = await User.findOne({ clerkId: userId });
    const plan = effectivePlan(dbUser?.plan, userId, clerkUser);
    if (!planAllowsExport(plan)) {
      return NextResponse.json(
        {
          error: 'Export requires a Creator or Church Pro plan.',
          code: 'UPGRADE_REQUIRED',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      jobId,
      clip,
      template,
      filter,
      font,
      animation,
      videoUrl: bodyVideoUrl,
      format = '9:16',
      quality = 'standard',
    } = body;

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

    const shotstackConfig = getShotstackConfig();
    if (!shotstackConfig) {
      const envPref = process.env.SHOTSTACK_ENV?.toLowerCase();
      const hint =
        envPref === 'production'
          ? 'SHOTSTACK_ENV is production but SHOTSTACK_PRODUCTION_KEY is missing. Add your Production key from the Shotstack dashboard.'
          : 'Add SHOTSTACK_PRODUCTION_KEY (production) or SHOTSTACK_SANDBOX_KEY (development) to your environment variables.';
      return NextResponse.json({ error: hint }, { status: 503 });
    }

    const {
      apiKey: SHOTSTACK_API_KEY,
      renderUrl: SHOTSTACK_URL,
      environment: shotstackEnv,
    } = shotstackConfig;

    let shotstackVideoUrl: string;
    try {
      shotstackVideoUrl = await resolveShotstackVideoUrl(resolvedVideoUrl);
      console.log('[Render] Shotstack source URL ready');
    } catch (urlError) {
      const detail = urlError instanceof Error ? urlError.message : 'Unknown R2 error';
      console.error('[Render] Failed to prepare video URL for Shotstack:', urlError);
      return NextResponse.json(
        {
          error: detail.includes('Missing Cloudflare R2')
            ? 'Cloud storage is not configured on the server. Add CF_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in Vercel, then redeploy.'
            : `Could not prepare your uploaded video for cloud rendering: ${detail}`,
          code: 'R2_ERROR',
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

    if (quality === 'high' && plan === 'free') {
      return NextResponse.json(
        { error: 'High quality exports require Creator or Church Pro.', code: 'UPGRADE_REQUIRED' },
        { status: 403 }
      );
    }

    const aspectRatio = format === '1:1' ? '1:1' : format === '16:9' ? '16:9' : '9:16';
    const resolution = quality === 'high' ? '1080' : 'hd';

    const start = parseTime(clip.start);
    const end = parseTime(clip.end);
    const duration = Math.max(end - start, 1);
    const videoUrl = resolvedVideoUrl;

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

    const isAudio = isAudioMediaUrl(videoUrl);

    const brandColor =
      (dbUser?.whiteLabel as { primaryColor?: string } | undefined)?.primaryColor || '#7c3aed';
    const logoUrl = (dbUser?.whiteLabel as { logoUrl?: string } | undefined)?.logoUrl;

    let tracks: Record<string, unknown>[] = [];

    if (isAudio) {
      const waveformHtml = `<div class="wrap"><div class="bars">${Array.from({ length: 32 })
        .map((_, i) => `<span style="animation-delay:${(i * 0.05).toFixed(2)}s"></span>`)
        .join('')}</div></div>`;
      const waveformCss = `
        .wrap { width:100%; height:100%; background:#0d0d14; display:flex; align-items:center; justify-content:center; }
        .bars { display:flex; gap:6px; align-items:center; height:240px; }
        .bars span { display:block; width:8px; height:40px; background:${brandColor}; border-radius:4px; animation: pulse 0.8s ease-in-out infinite alternate; }
        @keyframes pulse { from { height:24px; opacity:0.5; } to { height:200px; opacity:1; } }
      `;

      const bgClip = {
        asset: {
          type: 'html',
          html: waveformHtml,
          css: waveformCss,
          width: 1080,
          height: 1920,
        },
        start: 0,
        length: duration,
        fit: 'none',
      };

      const logoClip = logoUrl
        ? {
            asset: { type: 'image', src: logoUrl },
            start: 0,
            length: duration,
            width: 220,
            height: 220,
            position: 'center',
            opacity: 0.92,
          }
        : null;

      const audioCaptionClips = captionLines.map((text: string, i: number) => ({
        asset: {
          type: 'text',
          text: text.toUpperCase(),
          font: {
            family: fontFamily,
            size: 64,
            color: captionColor,
          },
        },
        width: 980,
        height: 220,
        start: i * captionDuration,
        length: captionDuration,
        position: 'bottom',
        transition: { in: transitionIn, out: 'fade' },
      }));

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
        ...(audioCaptionClips.length > 0 ? [{ clips: audioCaptionClips }] : []),
        ...(logoClip ? [{ clips: [logoClip] }] : []),
        { clips: [bgClip] },
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

    if (plan === 'free') {
      const watermarkClip = {
        asset: {
          type: 'text',
          text: 'VESPER',
          font: { family: 'Montserrat SemiBold', size: 28, color: '#FFFFFF' },
        },
        start: 0,
        length: duration,
        position: 'bottomRight',
        opacity: 0.35,
      };
      tracks.unshift({ clips: [watermarkClip] });
    }

    const shotstackEdit = {
      timeline: {
        tracks,
      },
      output: {
        format: 'mp4',
        resolution,
        aspectRatio,
      },
    };

    console.log(
      `[Shotstack] Render: env=${shotstackEnv}, template=${template}, filter=${filter}, font=${font}, animation=${animation}, duration=${duration}s`
    );

    const response = await fetch(SHOTSTACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SHOTSTACK_API_KEY || '',
      },
      body: JSON.stringify(shotstackEdit),
    });

    const raw = await response.text();
    let data: {
      success?: boolean;
      response?: { id?: string };
      message?: string;
      error?: string;
      errors?: { detail?: string; title?: string; status?: string }[];
    };
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
      try {
        const { markChecklist } = await import('@/lib/checklist');
        await markChecklist(userId, 'exportedReel');
      } catch {
        /* non-blocking */
      }
      return NextResponse.json({
        success: true,
        shotstackId: data.response.id,
        status: 'queued',
      });
    }

    const shotstackError = parseShotstackErrorBody(raw, data);

    console.error('[Shotstack] API Error:', shotstackError);
    console.error('[Shotstack] Payload sent:', JSON.stringify(shotstackEdit));

    const mapped = mapShotstackHttpError(response.status, shotstackError, shotstackEnv);
    return NextResponse.json(
      {
        error: mapped.error,
        code: 'SHOTSTACK_ERROR',
        shotstackStatus: response.status,
        shotstackDetail: shotstackError,
      },
      { status: mapped.httpStatus }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Render pipeline failed';
    console.error('[Render Engine] Critical Failure:', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
