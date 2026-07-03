/** Public Shotstack reel used for homepage hero demo and showcase featured slot. */
const DEFAULT_DEMO_REEL_URL =
  'https://shotstack-api-v1-output.s3-ap-southeast-2.amazonaws.com/zr4lvahkq2/30a16215-f0c5-43d8-bbff-71b5ffb3bc73.mp4';

/** Accept only direct media URLs (not bare bucket roots). */
export function resolveValidMp4Url(raw?: string): string | undefined {
  const candidate = raw?.trim();
  if (!candidate) return undefined;

  try {
    const parsed = new URL(candidate);
    const path = parsed.pathname.replace(/\/+$/, '');
    if (!path || !/\.(mp4|webm|mov)$/i.test(path)) return undefined;
    return candidate;
  } catch {
    return undefined;
  }
}

/** Valid demo reel URL — ignores invalid env overrides (e.g. bare S3 bucket root on Vercel). */
export function getDemoReelUrl(): string {
  return (
    resolveValidMp4Url(process.env.DEMO_VIDEO_AFTER_URL) ??
    resolveValidMp4Url(process.env.SHOWCASE_FEATURED_REEL_URL) ??
    DEFAULT_DEMO_REEL_URL
  );
}

export const VESPER_DEMO_REEL_URL = getDemoReelUrl();

export type ShowcaseFeaturedClip = {
  clipId: string;
  churchName: string;
  caption: string;
  videoUrl: string;
};

/** Always-on examples on /showcase (independent of user opt-in). */
export const SHOWCASE_FEATURED_CLIPS: ShowcaseFeaturedClip[] = [
  {
    clipId: 'featured-vesper-demo',
    churchName: 'Vesper Studio',
    caption: 'Are You Living Your True Calling?',
    videoUrl: VESPER_DEMO_REEL_URL,
  },
];
