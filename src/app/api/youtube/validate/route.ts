import { NextRequest, NextResponse } from 'next/server';
import {
  extractYouTubeVideoId,
  isValidYouTubeUrl,
  MAX_YOUTUBE_DURATION_SECONDS,
  validateYouTubeDuration,
  formatDurationHours,
} from '@/lib/youtubeValidation';

async function fetchOEmbed(videoUrl: string) {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
  const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return null;
  return res.json() as Promise<{ title?: string }>;
}

async function fetchDurationSeconds(videoId: string): Promise<number | undefined> {
  try {
    const res = await fetch(`https://invidious.projectsegfau.lt/api/v1/videos/${videoId}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    if (typeof data.lengthSeconds === 'number') return data.lengthSeconds;
  } catch {
    // Duration is optional — format/unavailability checks still apply
  }
  return undefined;
}

export async function GET(req: NextRequest) {
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

  const durationSeconds = await fetchDurationSeconds(videoId);
  const durationError = validateYouTubeDuration(durationSeconds);
  if (durationError) {
    return NextResponse.json(durationError);
  }

  return NextResponse.json({
    ok: true,
    videoId,
    title: oembed.title,
    durationSeconds,
    maxDurationSeconds: MAX_YOUTUBE_DURATION_SECONDS,
    message:
      durationSeconds != null
        ? `Ready to analyze (${formatDurationHours(durationSeconds)})`
        : 'Ready to analyze',
  });
}
