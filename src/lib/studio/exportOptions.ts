/** Animated caption styles — burned into export via Shotstack transitions. */

export const CAPTION_ANIMATIONS = [
  { id: 'wordPop', shotstackIn: 'slideUp', shotstackOut: 'fade', previewClass: 'animate-caption-word-pop' },
  { id: 'slideUp', shotstackIn: 'slideUp', shotstackOut: 'slideUp', previewClass: 'animate-caption-slide-up' },
  { id: 'typewriter', shotstackIn: 'fade', shotstackOut: 'fade', previewClass: 'animate-caption-typewriter' },
  { id: 'highlight', shotstackIn: 'fade', shotstackOut: 'fade', previewClass: 'animate-caption-highlight' },
  { id: 'scalePulse', shotstackIn: 'zoom', shotstackOut: 'fade', previewClass: 'animate-caption-scale-pulse' },
] as const;

export type CaptionAnimationId = (typeof CAPTION_ANIMATIONS)[number]['id'];

export const CAPTION_ANIMATION_MAP: Record<string, { in: string; out: string }> = Object.fromEntries(
  CAPTION_ANIMATIONS.map((a) => [a.id, { in: a.shotstackIn, out: a.shotstackOut }])
);

/** Royalty-free background music catalog (URLs served from /api/music or CDN). */
export const BACKGROUND_MUSIC_TRACKS = [
  { id: 'inspire-01', name: 'Morning Light', category: 'inspiring', mood: 'uplifting', src: '/music/inspire-01.mp3' },
  { id: 'inspire-02', name: 'Rise Up', category: 'inspiring', mood: 'uplifting', src: '/music/inspire-02.mp3' },
  { id: 'calm-01', name: 'Still Waters', category: 'calm', mood: 'reflective', src: '/music/calm-01.mp3' },
  { id: 'calm-02', name: 'Quiet Prayer', category: 'calm', mood: 'reflective', src: '/music/calm-02.mp3' },
  { id: 'epic-01', name: 'Kingdom Come', category: 'epic', mood: 'cinematic', src: '/music/epic-01.mp3' },
  { id: 'epic-02', name: 'Glory Dawn', category: 'epic', mood: 'cinematic', src: '/music/epic-02.mp3' },
  { id: 'acoustic-01', name: 'Warm Strings', category: 'acoustic', mood: 'warm', src: '/music/acoustic-01.mp3' },
  { id: 'acoustic-02', name: 'Gentle Folk', category: 'acoustic', mood: 'warm', src: '/music/acoustic-02.mp3' },
] as const;

export const CTA_TYPES = [
  { id: 'subscribe', defaultText: 'Follow for more sermons' },
  { id: 'watchFull', defaultText: 'Watch the full sermon' },
  { id: 'joinSunday', defaultText: 'Join us Sunday — link in bio' },
  { id: 'give', defaultText: 'Give online today' },
  { id: 'prayer', defaultText: 'DM us your prayer request' },
  { id: 'custom', defaultText: '' },
] as const;

export type CtaTypeId = (typeof CTA_TYPES)[number]['id'];

export const INTRO_OUTRO_STYLES = [
  { id: 'minimal', name: 'Minimal' },
  { id: 'cinematic', name: 'Cinematic' },
  { id: 'bold', name: 'Bold' },
  { id: 'warm', name: 'Warm' },
  { id: 'dark', name: 'Dark' },
  { id: 'light', name: 'Light' },
] as const;

export type ExportExtras = {
  captionAnimation: CaptionAnimationId;
  musicEnabled: boolean;
  musicTrackId: string;
  musicVolume: number;
  musicFade: boolean;
  musicAutoMatch: boolean;
  ctaEnabled: boolean;
  ctaType: CtaTypeId;
  ctaText: string;
  ctaUrl: string;
  includeIntro: boolean;
  includeOutro: boolean;
  bumperStyle: string;
  churchName: string;
  tagline: string;
  website: string;
  socialHandle: string;
};

export const DEFAULT_EXPORT_EXTRAS: ExportExtras = {
  captionAnimation: 'slideUp',
  musicEnabled: false,
  musicTrackId: 'inspire-01',
  musicVolume: 0.1,
  musicFade: true,
  musicAutoMatch: false,
  ctaEnabled: false,
  ctaType: 'subscribe',
  ctaText: '',
  ctaUrl: '',
  includeIntro: false,
  includeOutro: false,
  bumperStyle: 'minimal',
  churchName: '',
  tagline: '',
  website: '',
  socialHandle: '',
};

export function pickMusicForMood(tone: 'uplifting' | 'reflective' | 'cinematic' | 'warm' | string) {
  const match = BACKGROUND_MUSIC_TRACKS.find((t) => t.mood === tone);
  return match?.id ?? 'inspire-01';
}

export function resolveCtaText(type: CtaTypeId, custom?: string) {
  if (type === 'custom') return custom || 'Learn more';
  return CTA_TYPES.find((c) => c.id === type)?.defaultText || '';
}
