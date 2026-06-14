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
import {
  BACKGROUND_MUSIC_TRACKS,
  CAPTION_ANIMATION_MAP,
  pickMusicForMood,
  resolveCtaText,
  type CtaTypeId,
} from '@/lib/studio/exportOptions';

const INTRO_DURATION = 2.5;
const OUTRO_DURATION = 4;
const CTA_DURATION = 4;

const BUMPER_BACKGROUNDS: Record<string, string> = {
  minimal: '#0a0a0f',
  cinematic: '#050508',
  bold: '#7c3aed',
  warm: '#78350f',
  dark: '#000000',
  light: '#f4f4f5',
};

function buildCaptionTextClips(
  captionLines: string[],
  segmentStart: number,
  segmentDuration: number,
  captionAnimation: string,
  fontFamily: string,
  captionColor: string,
  transitionIn: string
) {
  const capAnim = CAPTION_ANIMATION_MAP[captionAnimation] || CAPTION_ANIMATION_MAP.slideUp;
  const perLine = captionLines.length > 0 ? segmentDuration / captionLines.length : segmentDuration;

  if (captionAnimation === 'wordPop' || captionAnimation === 'typewriter' || captionAnimation === 'highlight') {
    const clips: Record<string, unknown>[] = [];

    captionLines.forEach((line, lineIndex) => {
      const words = line.split(/\s+/).filter(Boolean);
      const lineStart = segmentStart + lineIndex * perLine;
      const wordDuration = perLine / Math.max(words.length, 1);

      words.forEach((word, wordIndex) => {
        clips.push({
          asset: {
            type: 'text',
            text: word.toUpperCase(),
            font: { family: fontFamily, size: 72, color: captionColor },
          },
          width: 1080,
          height: 200,
          start: lineStart + wordIndex * wordDuration,
          length: wordDuration,
          position: 'bottom',
          transition: { in: capAnim.in, out: 'fade' },
        });
      });
    });

    return clips;
  }

  return captionLines.map((text: string, i: number) => ({
    asset: {
      type: 'text',
      text: text.toUpperCase(),
      font: { family: fontFamily, size: 80, color: captionColor },
    },
    width: 1080,
    height: 200,
    start: segmentStart + i * perLine,
    length: perLine,
    position: 'bottom',
    transition: { in: capAnim.in, out: capAnim.out || transitionIn },
  }));
}

function buildBumperHtml(
  style: string,
  title: string,
  subtitle: string,
  brandColor: string,
  logoUrl?: string
) {
  const bg = BUMPER_BACKGROUNDS[style] || BUMPER_BACKGROUNDS.minimal;
  const textColor = style === 'light' ? '#18181b' : '#ffffff';
  const logoBlock = logoUrl
    ? `<img src="${logoUrl}" style="width:140px;height:140px;object-fit:contain;margin-bottom:24px;" />`
    : '';
  const html = `<div class="wrap">${logoBlock}<h1>${title}</h1><p>${subtitle}</p></div>`;
  const css = `
    .wrap { width:100%; height:100%; background:${bg}; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:48px; text-align:center; }
    h1 { color:${textColor}; font-size:64px; font-weight:800; margin:0 0 16px; letter-spacing:0.04em; }
    p { color:${brandColor}; font-size:32px; margin:0; opacity:0.95; }
  `;
  return { html, css };
}

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
  easter_glory: '#E9D5FF',
  christmas_advent: '#FDE68A',
  thanksgiving_gratitude: '#FCD34D',
  newyear_vision: '#FDE047',
  mothers_day_warm: '#FECDD3',
  fathers_day_warm: '#BFDBFE',
  back_to_school: '#67E8F9',
  special_series: '#C4B5FD',
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
      captionAnimation = 'slideUp',
      musicEnabled = false,
      musicTrackId = 'inspire-01',
      musicVolume = 0.1,
      musicFade = true,
      musicAutoMatch = false,
      ctaEnabled = false,
      ctaType = 'subscribe',
      ctaText: bodyCtaText = '',
      ctaUrl: _ctaUrl = '',
      includeIntro = false,
      includeOutro = false,
      bumperStyle = 'minimal',
      churchName = '',
      tagline = '',
      website = '',
      socialHandle = '',
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
    const introLen = includeIntro ? INTRO_DURATION : 0;
    const outroLen = includeOutro ? OUTRO_DURATION : 0;
    const totalDuration = introLen + duration + outroLen;
    const videoUrl = resolvedVideoUrl;

    const captionColor = TEMPLATE_COLORS[template] || '#FFFFFF';
    const fontFamily = FONT_FAMILIES[font] || 'Montserrat';
    const transitionIn = ANIMATION_MAP[animation] || 'fade';

    const captions = (clip.suggested_captions || [])
      .map((text: string) => String(text || '').trim())
      .filter(Boolean);

    const fallbackCaption = String(clip.main_quote || clip.hook_title || 'SERMON HIGHLIGHT').trim();
    const captionLines = captions.length > 0 ? captions : [fallbackCaption];

    const brandColor =
      (dbUser?.whiteLabel as { primaryColor?: string } | undefined)?.primaryColor || '#7c3aed';
    const logoUrl = (dbUser?.whiteLabel as { logoUrl?: string } | undefined)?.logoUrl;
    const churchLabel = churchName || (dbUser?.whiteLabel as { churchName?: string } | undefined)?.churchName || 'Your Church';

    const captionClips = buildCaptionTextClips(
      captionLines,
      introLen,
      duration,
      captionAnimation,
      fontFamily,
      captionColor,
      transitionIn
    );

    const overlayClips: Record<string, unknown>[] = [];

    if (ctaEnabled) {
      const ctaLabel = resolveCtaText(ctaType as CtaTypeId, bodyCtaText).toUpperCase();
      overlayClips.push({
        asset: {
          type: 'text',
          text: ctaLabel,
          font: { family: fontFamily, size: 56, color: captionColor },
        },
        width: 980,
        height: 260,
        start: introLen + Math.max(duration - CTA_DURATION, 0),
        length: Math.min(CTA_DURATION, duration),
        position: 'center',
        transition: { in: 'zoom', out: 'fade' },
      });
    }

    if (includeIntro) {
      const intro = buildBumperHtml(bumperStyle, churchLabel, tagline || 'Sermon Highlights', brandColor, logoUrl);
      overlayClips.push({
        asset: { type: 'html', html: intro.html, css: intro.css, width: 1080, height: 1920 },
        start: 0,
        length: INTRO_DURATION,
        fit: 'none',
      });
    }

    if (includeOutro) {
      const outroLines = [
        website ? `Watch the full sermon at ${website}` : 'Watch the full sermon online',
        socialHandle ? `@${socialHandle.replace(/^@/, '')}` : '',
        'Like & Follow for more',
      ]
        .filter(Boolean)
        .join(' · ');
      const outro = buildBumperHtml(bumperStyle, churchLabel, outroLines, brandColor, logoUrl);
      overlayClips.push({
        asset: { type: 'html', html: outro.html, css: outro.css, width: 1080, height: 1920 },
        start: introLen + duration,
        length: OUTRO_DURATION,
        fit: 'none',
      });
    }

    // Build caption clips (legacy path removed — handled above)

    const isAudio = isAudioMediaUrl(videoUrl);

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
        length: totalDuration,
        fit: 'none',
      };

      const logoClip = logoUrl
        ? {
            asset: { type: 'image', src: logoUrl },
            start: introLen,
            length: duration,
            width: 220,
            height: 220,
            position: 'center',
            opacity: 0.92,
          }
        : null;

      const audioCaptionClips = buildCaptionTextClips(
        captionLines,
        introLen,
        duration,
        captionAnimation,
        fontFamily,
        captionColor,
        transitionIn
      ).map((clipDef) => ({
        ...clipDef,
        asset: {
          ...(clipDef.asset as Record<string, unknown>),
          font: { family: fontFamily, size: 64, color: captionColor },
        },
        width: 980,
        height: 220,
      }));

      const audioClip = {
        asset: {
          type: 'audio',
          src: shotstackVideoUrl,
          trim: start,
        },
        start: introLen,
        length: duration,
      };

      tracks = [
        ...(overlayClips.length > 0 ? [{ clips: overlayClips }] : []),
        ...(audioCaptionClips.length > 0 ? [{ clips: audioCaptionClips }] : []),
        ...(logoClip ? [{ clips: [logoClip] }] : []),
        { clips: [bgClip] },
        { clips: [audioClip] },
      ];
    } else {
      // Build video clip
      const videoClip: Record<string, unknown> = {
        asset: { type: 'video', src: shotstackVideoUrl, trim: start },
        start: introLen,
        length: duration,
        fit: 'cover',
      };

      // Apply color filter if selected (Shotstack filter property on clip)
      if (filter && filter !== 'none') {
        const shotstackFilter = FILTER_MAP[filter];
        if (shotstackFilter) videoClip.filter = shotstackFilter;
      }

      tracks = [
        ...(overlayClips.length > 0 ? [{ clips: overlayClips }] : []),
        ...(captionClips.length > 0 ? [{ clips: captionClips }] : []),
        { clips: [videoClip] },
      ];
    }

    if (musicEnabled) {
      const mood = musicAutoMatch ? 'uplifting' : undefined;
      const resolvedTrackId = musicAutoMatch ? pickMusicForMood(mood || 'uplifting') : musicTrackId;
      const track = BACKGROUND_MUSIC_TRACKS.find((t) => t.id === resolvedTrackId);
      if (track) {
        const origin = req.nextUrl.origin;
        const musicSrc = `${origin}${track.src}`;
        tracks.push({
          clips: [
            {
              asset: {
                type: 'audio',
                src: musicSrc,
                volume: Math.min(Math.max(musicVolume, 0), 0.3),
              },
              start: musicFade ? 0.5 : 0,
              length: musicFade ? Math.max(totalDuration - 1, 1) : totalDuration,
              transition: musicFade ? { in: 'fade', out: 'fade' } : undefined,
            },
          ],
        });
      }
    }

    if (plan === 'free') {
      const watermarkClip = {
        asset: {
          type: 'text',
          text: 'VESPER',
          font: { family: 'Montserrat SemiBold', size: 28, color: '#FFFFFF' },
        },
        start: introLen,
        length: duration,
        position: 'bottomRight',
        opacity: 0.35,
      };
      tracks.unshift({ clips: [watermarkClip] });
    }

    const shotstackEdit = {
      timeline: {
        background: '#000000',
        tracks,
      },
      output: {
        format: 'mp4',
        resolution,
        aspectRatio,
      },
    };

    console.log(
      `[Shotstack] Render: env=${shotstackEnv}, template=${template}, filter=${filter}, font=${font}, animation=${animation}, captionAnimation=${captionAnimation}, duration=${duration}s, total=${totalDuration}s`
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
