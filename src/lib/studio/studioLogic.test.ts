import { describe, expect, it } from 'vitest';
import { DEFAULT_EXPORT_EXTRAS } from './exportOptions';
import {
  buildExportSettings,
  buildPlatformCaption,
  clampTrim,
  defaultCaption,
  extrasFromBrandKit,
  styleFromBrandKit,
  trimWindow,
} from './studioLogic';

describe('styleFromBrandKit', () => {
  it('uses defaults without a saved kit', () => {
    expect(styleFromBrandKit(null)).toEqual({ template: 'minimal', filter: 'none', font: 'outfit', animation: 'fade' });
  });

  it('uses the saved look', () => {
    expect(
      styleFromBrandKit({ template: 'fire', filter: 'glory', font: 'serif', animation: 'zoom' })
    ).toEqual({ template: 'fire', filter: 'glory', font: 'serif', animation: 'zoom' });
  });
});

describe('extrasFromBrandKit', () => {
  it('returns a copy of the defaults without a kit', () => {
    const extras = extrasFromBrandKit(null);
    expect(extras).toEqual(DEFAULT_EXPORT_EXTRAS);
    expect(extras).not.toBe(DEFAULT_EXPORT_EXTRAS);
  });

  it('reads saved values and ignores wrong types', () => {
    const kit = {
      template: 'minimal',
      filter: 'none',
      font: 'outfit',
      animation: 'fade',
      musicEnabled: true,
      musicVolume: 'loud',
      musicFade: false,
      ctaEnabled: 1,
      churchName: 'Grace Chapel',
      website: 42,
    };
    const extras = extrasFromBrandKit(kit);
    expect(extras.musicEnabled).toBe(true);
    expect(extras.musicVolume).toBe(DEFAULT_EXPORT_EXTRAS.musicVolume);
    expect(extras.musicFade).toBe(false);
    expect(extras.ctaEnabled).toBe(true);
    expect(extras.churchName).toBe('Grace Chapel');
    expect(extras.website).toBe('');
  });
});

describe('defaultCaption', () => {
  it('prefers the first non-empty AI caption', () => {
    expect(defaultCaption({ suggested_captions: ['  ', 'He ran.'], main_quote: 'quote' })).toBe('He ran.');
  });

  it('falls back to the quote, then empty', () => {
    expect(defaultCaption({ main_quote: 'quote' })).toBe('quote');
    expect(defaultCaption({})).toBe('');
  });
});

describe('buildPlatformCaption', () => {
  it('adds the platform prefix and top quote', () => {
    const c = buildPlatformCaption('x', 'Watch the full message.', 'Grace runs.');
    expect(c.text).toBe('Powerful moment: "Grace runs."\n\nWatch the full message.');
    expect(c.limit).toBe(280);
    expect(c.overLimit).toBe(false);
  });

  it('flags captions over the platform limit', () => {
    const c = buildPlatformCaption('x', 'a'.repeat(300));
    expect(c.overLimit).toBe(true);
    expect(c.count).toBeGreaterThan(280);
  });

  it('falls back to the first platform for unknown ids', () => {
    expect(buildPlatformCaption('myspace', 'hi').platformId).toBe('tiktok');
  });
});

describe('trim', () => {
  it('pads the window a minute either side, never below zero', () => {
    expect(trimWindow(30, 90)).toEqual({ min: 0, max: 150 });
    expect(trimWindow(300, 340)).toEqual({ min: 240, max: 400 });
  });

  it('keeps handles inside the window and at least a second apart', () => {
    const w = { min: 0, max: 100 };
    expect(clampTrim({ start: -5, end: 120 }, w, 'start')).toEqual({ start: 0, end: 100 });
    expect(clampTrim({ start: 50, end: 50 }, w, 'start')).toEqual({ start: 49, end: 50 });
    expect(clampTrim({ start: 50, end: 50 }, w, 'end')).toEqual({ start: 50, end: 51 });
    expect(clampTrim({ start: 100, end: 100 }, w, 'start')).toEqual({ start: 99, end: 100 });
  });
});

describe('buildExportSettings', () => {
  it('combines look, trim, caption and extras into the render request', () => {
    const settings = buildExportSettings(
      { template: 'fire', filter: 'none', font: 'outfit', animation: 'fade' },
      { start: 65, end: 102 },
      'He ran.',
      DEFAULT_EXPORT_EXTRAS
    );
    expect(settings).toMatchObject({ template: 'fire', trimStart: 65, trimEnd: 102, caption: 'He ran.' });
    expect(settings.musicTrackId).toBe(DEFAULT_EXPORT_EXTRAS.musicTrackId);
  });
});
