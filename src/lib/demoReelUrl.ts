/** Public Shotstack reel used for homepage hero demo and showcase featured slot. */
export const VESPER_DEMO_REEL_URL =
  process.env.DEMO_VIDEO_AFTER_URL ??
  process.env.SHOWCASE_FEATURED_REEL_URL ??
  'https://shotstack-api-v1-output.s3-ap-southeast-2.amazonaws.com/zr4lvahkq2/30a16215-f0c5-43d8-bbff-71b5ffb3bc73.mp4';

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
