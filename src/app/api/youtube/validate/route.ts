import { NextRequest, NextResponse } from 'next/server';
import {
  extractYouTubeVideoId,
  isValidYouTubeUrl,
  MAX_YOUTUBE_DURATION_SECONDS,
  validateYouTubeDuration,
  formatDurationHours,
} from '@/lib/youtubeValidation';

async function fetchOEmbed(videoUrl: string): Promise<{ title?: string } | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return (await res.json()) as { title?: string };
  } catch {
    return null;
  }
}

type InvidiousMeta = {
  lengthSeconds?: number;
  liveNow?: boolean;
  liveStatus?: string;
  published?: number;
};

async function fetchInvidiousMeta(videoId: string): Promise<InvidiousMeta | null> {
  try {
    const res = await fetch(`https://invidious.projectsegfau.lt/api/v1/videos/${videoId}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('json')) return null;
    return (await res.json()) as InvidiousMeta;
  } catch {
    return null;
  }
}

function liveStreamNotice(meta: InvidiousMeta | null): string | null {
  if (!meta) return null;
  if (meta.liveNow) {
    return 'This stream is still live — wait until it ends before clipping for best results.';
  }
  const endedRecently =
    meta.liveStatus === 'post_live' ||
    (meta.published && Date.now() / 1000 - meta.published < 86400);
  if (endedRecently) {
    return 'This stream just ended — YouTube is still processing the full replay. Check back in 1–2 hours for best results.';
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get('url')?.trim() ?? '';

    if (!url || !isValidYouTubeUrl(url)) {
      return NextResponse.json({
        ok: false,
        code: 'invalid',
        message: 'Please enter a valid YouTube video URL',
      });
    }

    const videoId = extractYouTubeVideoId(url)!;
    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const oembed = await fetchOEmbed(canonicalUrl);
    if (!oembed) {
      return NextResponse.json({
        ok: false,
        code: 'unavailable',
        message: 'This video is private or unavailable. Try a public YouTube link.',
      });
    }

    const invidious = await fetchInvidiousMeta(videoId);
    const durationSeconds =
      typeof invidious?.lengthSeconds === 'number' ? invidious.lengthSeconds : undefined;
    const durationError = validateYouTubeDuration(durationSeconds);
    if (durationError && !invidious?.liveNow) {
      return NextResponse.json(durationError);
    }

    const liveNotice = liveStreamNotice(invidious);

    return NextResponse.json({
      ok: true,
      videoId,
      title: oembed.title,
      durationSeconds,
      maxDurationSeconds: MAX_YOUTUBE_DURATION_SECONDS,
      isLive: Boolean(invidious?.liveNow),
      liveNotice,
      message:
        liveNotice ||
        (durationSeconds != null
          ? `Ready to analyze (${formatDurationHours(durationSeconds)})`
          : 'Ready to analyze'),
    });
  } catch (error) {
    console.error('[YouTube Validate]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'server_error',
        message: 'Could not verify this YouTube link right now. Please try again.',
      },
      { status: 500 }
    );
  }
}
