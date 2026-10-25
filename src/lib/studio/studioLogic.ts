/**
 * Pure Vesper Studio logic (no React, no DOM) so it can be unit-tested.
 */
import { DEFAULT_EXPORT_EXTRAS, type ExportExtras } from './exportOptions';
import { STUDIO_PLATFORMS } from './constants';
import type { BrandKit } from './constants';
import type { ExportSettings } from './types';

export type StyleState = { template: string; filter: string; font: string; animation: string };

/** Studio look from the saved brand kit, or the defaults. */
export function styleFromBrandKit(kit: BrandKit | null): StyleState {
  return {
    template: kit?.template ?? 'minimal',
    filter: kit?.filter ?? 'none',
    font: kit?.font ?? 'outfit',
    animation: kit?.animation ?? 'fade',
  };
}

const str = (v: unknown, fallback: string) => (typeof v === 'string' && v ? v : fallback);

/** Export extras (captions, music, end card, bumpers) from the saved brand kit, or the defaults. */
export function extrasFromBrandKit(kit: BrandKit | null): ExportExtras {
  if (!kit) return { ...DEFAULT_EXPORT_EXTRAS };
  const d = DEFAULT_EXPORT_EXTRAS;
  return {
    ...d,
    captionAnimation: str(kit.captionAnimation, d.captionAnimation) as ExportExtras['captionAnimation'],
    musicEnabled: Boolean(kit.musicEnabled),
    musicTrackId: str(kit.musicTrackId, d.musicTrackId),
    musicVolume: typeof kit.musicVolume === 'number' ? kit.musicVolume : d.musicVolume,
    musicFade: kit.musicFade !== false,
    musicAutoMatch: Boolean(kit.musicAutoMatch),
    ctaEnabled: Boolean(kit.ctaEnabled),
    ctaType: str(kit.ctaType, d.ctaType) as ExportExtras['ctaType'],
    ctaText: str(kit.ctaText, ''),
    ctaUrl: str(kit.ctaUrl, ''),
    includeIntro: Boolean(kit.includeIntro),
    includeOutro: Boolean(kit.includeOutro),
    bumperStyle: str(kit.bumperStyle, d.bumperStyle),
    churchName: str(kit.churchName, ''),
    tagline: str(kit.tagline, ''),
    website: str(kit.website, ''),
    socialHandle: str(kit.socialHandle, ''),
  };
}

/** The caption burned into the reel: the first AI suggestion, else the clip's quote. */
export function defaultCaption(clip: { suggested_captions?: string[]; main_quote?: string }): string {
  return clip.suggested_captions?.find((c) => c?.trim()) ?? clip.main_quote ?? '';
}

export type PlatformCaption = {
  platformId: string;
  label: string;
  text: string;
  count: number;
  limit: number | null;
  overLimit: boolean;
};

/** Post caption for one platform: its prefix, the top quote (if any), then the reel caption. */
export function buildPlatformCaption(platformId: string, caption: string, topQuote?: string): PlatformCaption {
  const platform = STUDIO_PLATFORMS.find((p) => p.id === platformId) ?? STUDIO_PLATFORMS[0];
  const prefix = platform.prefix ?? '';
  const text = topQuote ? `${prefix}"${topQuote}"\n\n${caption}` : `${prefix}${caption}`;
  const limit = platform.limit ?? null;
  return {
    platformId: platform.id,
    label: platform.label,
    text,
    count: text.length,
    limit,
    overLimit: limit !== null && text.length > limit,
  };
}

/** How far the trim handles can move: one minute either side of the AI's clip. */
export const TRIM_PADDING_SECONDS = 60;

/** Never past the end of the source video, once its length is known. */
export function trimWindow(clipStart: number, clipEnd: number, sourceDuration?: number | null) {
  const min = Math.max(0, clipStart - TRIM_PADDING_SECONDS);
  let max = clipEnd + TRIM_PADDING_SECONDS;
  if (sourceDuration && Number.isFinite(sourceDuration) && sourceDuration > 1) {
    max = Math.min(max, Math.floor(sourceDuration));
  }
  return { min, max: Math.max(max, min + 1) };
}

/** Keep start < end (at least 1s apart) and both inside the window. */
export function clampTrim(
  next: { start: number; end: number },
  window: { min: number; max: number },
  moved: 'start' | 'end'
): { start: number; end: number } {
  let start = Math.min(Math.max(next.start, window.min), window.max - 1);
  let end = Math.min(Math.max(next.end, window.min + 1), window.max);
  if (end - start < 1) {
    if (moved === 'start') start = end - 1;
    else end = start + 1;
  }
  return { start, end };
}

/** Most short-form reels run under a minute; longer is allowed but worth flagging. */
export const SUGGESTED_MAX_SECONDS = 60;

export function buildExportSettings(
  style: StyleState,
  trim: { start: number; end: number },
  caption: string,
  extras: ExportExtras,
  sourceDuration?: number | null
): ExportSettings {
  return {
    ...(sourceDuration && Number.isFinite(sourceDuration) ? { sourceDuration } : {}),
    template: style.template,
    filter: style.filter,
    font: style.font,
    animation: style.animation,
    trimStart: trim.start,
    trimEnd: trim.end,
    caption,
    ...extras,
  };
}
