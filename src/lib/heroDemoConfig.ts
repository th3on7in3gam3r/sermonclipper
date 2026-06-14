/** Hero demo clips — public /demo/*.mp4 in repo; optional CDN via signed URLs. */

export type HeroDemoPanel = 'before' | 'after';

export type HeroDemoClip = {
  storageKey: string;
  clipStart: number;
  clipEnd: number | null;
  publicSrc: string;
  /** When set, served directly (e.g. Shotstack render output). */
  externalUrl?: string;
};

const BEFORE_KEY = process.env.DEMO_VIDEO_BEFORE_KEY || 'demo/sermon-before.mp4';
const AFTER_KEY = process.env.DEMO_VIDEO_AFTER_KEY || 'demo/reel-after.mp4';

const DEFAULT_AFTER_REEL_URL =
  'https://shotstack-api-v1-output.s3-ap-southeast-2.amazonaws.com/zr4lvahkq2/0b4b2b61-1a2e-4121-b0c6-6c630b12fdc0.mp4';

/** Public previews are ~18s — do not seek to 360s unless you upload a full sermon to CDN. */
const BEFORE_CLIP_START = Number(process.env.DEMO_VIDEO_BEFORE_START ?? 0);
const BEFORE_CLIP_END = process.env.DEMO_VIDEO_BEFORE_END
  ? Number(process.env.DEMO_VIDEO_BEFORE_END)
  : null;

export const HERO_DEMO_CLIPS: Record<HeroDemoPanel, HeroDemoClip> = {
  before: {
    storageKey: BEFORE_KEY,
    clipStart: BEFORE_CLIP_START,
    clipEnd: BEFORE_CLIP_END,
    publicSrc: '/demo/sermon-before.mp4',
  },
  after: {
    storageKey: AFTER_KEY,
    clipStart: 0,
    clipEnd: null,
    publicSrc: '/demo/reel-after.mp4',
    externalUrl: process.env.DEMO_VIDEO_AFTER_URL || DEFAULT_AFTER_REEL_URL,
  },
};

export function getHeroDemoClip(panel: HeroDemoPanel): HeroDemoClip {
  return HERO_DEMO_CLIPS[panel];
}
