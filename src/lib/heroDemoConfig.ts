/** Hero demo clips — prefer CDN paths; never serve from /public in production when CDN is set. */

export type HeroDemoPanel = 'before' | 'after';

export type HeroDemoClip = {
  storageKey: string;
  clipStart: number;
  clipEnd: number | null;
  cdnPath?: string;
  fallbackSrc?: string;
};

const CDN_HOST = process.env.NEXT_PUBLIC_BUNNY_CDN_HOST?.replace(/\/$/, '');

const CLIP_START = 360;
const CLIP_END = 378;

const BEFORE_KEY = process.env.DEMO_VIDEO_BEFORE_KEY || 'demo/sermon-before.mp4';
const AFTER_KEY = process.env.DEMO_VIDEO_AFTER_KEY || 'demo/reel-after.mp4';

function cdnUrl(path: string): string | undefined {
  if (!CDN_HOST) return undefined;
  return `https://${CDN_HOST}/${path.replace(/^\//, '')}`;
}

export const HERO_DEMO_CLIPS: Record<HeroDemoPanel, HeroDemoClip> = {
  before: {
    storageKey: BEFORE_KEY,
    clipStart: CLIP_START,
    clipEnd: CLIP_END,
    cdnPath: cdnUrl(BEFORE_KEY),
    fallbackSrc: CDN_HOST ? undefined : '/demo/sermon-before.mp4',
  },
  after: {
    storageKey: AFTER_KEY,
    clipStart: 0,
    clipEnd: null,
    cdnPath: cdnUrl(AFTER_KEY),
    fallbackSrc: CDN_HOST ? undefined : '/demo/reel-after.mp4',
  },
};

export function getHeroDemoClip(panel: HeroDemoPanel): HeroDemoClip {
  return HERO_DEMO_CLIPS[panel];
}
