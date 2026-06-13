/** Stable R2 object URLs for the landing-page hero demo (no presigned query params). */

export type HeroDemoPanel = 'before' | 'after';

export type HeroDemoClip = {
  /** Private R2 URL or public path under /public */
  storageUrl: string;
  clipStart: number;
  clipEnd: number;
  /** Local fallback if presign fails (e.g. dev without R2 creds) */
  fallbackSrc?: string;
};

const SERMON_MASTER_URL =
  'https://6ebb2dfb5b250f7535df99b8179a3fb4.r2.cloudflarestorage.com/sermon-clipper/uploads/wiw71/UNDERSTANDING_THE_POWER_OF_YOUR_CONFESSION____Pastor_Kenneth_Mutegyeki.mp4';

/** ~18s highlight from the wiw71 studio sample (user suggested #t=360,410). */
const CLIP_START = 360;
const CLIP_END = 378;

/**
 * Full-width sermon panel — original 16:9 upload.
 * After panel uses the same moment, framed as 9:16 in CSS until a Shotstack export URL is added.
 */
export const HERO_DEMO_CLIPS: Record<HeroDemoPanel, HeroDemoClip> = {
  before: {
    storageUrl: SERMON_MASTER_URL,
    clipStart: CLIP_START,
    clipEnd: CLIP_END,
    fallbackSrc: '/demo/sermon-before.mp4',
  },
  after: {
    storageUrl: SERMON_MASTER_URL,
    clipStart: CLIP_START,
    clipEnd: CLIP_END,
    fallbackSrc: '/demo/reel-after.mp4',
  },
};

export function getHeroDemoClip(panel: HeroDemoPanel): HeroDemoClip {
  return HERO_DEMO_CLIPS[panel];
}
