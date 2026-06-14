import {
  BRAND_KIT_KEY,
  STUDIO_ANIMATIONS,
  STUDIO_FILTERS,
  STUDIO_FONTS,
  STUDIO_TEMPLATES,
  type BrandKit,
} from './constants';
import { SEASONAL_TEMPLATES } from '@/lib/seasonalTemplates';

/** Map pre-refactor Studio IDs to current Shotstack-aligned IDs. */
const LEGACY_TEMPLATE_MAP: Record<string, string> = {
  professional: 'minimal',
  impact: 'modern',
  luxury: 'fire',
};

const LEGACY_FILTER_MAP: Record<string, string> = {
  cinema: 'vintage',
  vibrant: 'glory',
};

const LEGACY_FONT_MAP: Record<string, string> = {
  inter: 'outfit',
  roboto: 'impact',
};

const LEGACY_ANIMATION_MAP: Record<string, string> = {
  pop: 'slideUp',
  pulse: 'fade',
  shake: 'zoom',
  glitch: 'carve',
};

const VALID_TEMPLATES = new Set([
  ...STUDIO_TEMPLATES.map((t) => t.id),
  ...SEASONAL_TEMPLATES.map((t) => t.id),
]);
const VALID_FILTERS = new Set(STUDIO_FILTERS.map((f) => f.id));
const VALID_FONTS = new Set(STUDIO_FONTS.map((f) => f.id));
const VALID_ANIMATIONS = new Set(STUDIO_ANIMATIONS.map((a) => a.id));

function coerceId(
  value: unknown,
  legacyMap: Record<string, string>,
  valid: Set<string>,
  fallback: string
): string {
  const raw = typeof value === 'string' ? value : '';
  const mapped = legacyMap[raw] ?? raw;
  return valid.has(mapped) ? mapped : fallback;
}

/** Normalize core fields while keeping any extra keys the user may have stored. */
export function normalizeBrandKit(raw: Record<string, unknown>): BrandKit {
  return {
    ...raw,
    template: coerceId(raw.template, LEGACY_TEMPLATE_MAP, VALID_TEMPLATES, 'minimal'),
    filter: coerceId(raw.filter, LEGACY_FILTER_MAP, VALID_FILTERS, 'none'),
    font: coerceId(raw.font, LEGACY_FONT_MAP, VALID_FONTS, 'outfit'),
    animation: coerceId(raw.animation, LEGACY_ANIMATION_MAP, VALID_ANIMATIONS, 'fade'),
  };
}

function readRawBrandKit(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(BRAND_KIT_KEY);
    if (!saved) return null;
    const parsed: unknown = JSON.parse(saved);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function loadBrandKit(): BrandKit | null {
  const raw = readRawBrandKit();
  if (!raw) return null;
  return normalizeBrandKit(raw);
}

/** Write migrated profile once after mount (avoids localStorage access during render). */
export function migrateStoredBrandKit(): void {
  if (typeof window === 'undefined') return;
  const raw = readRawBrandKit();
  if (!raw) return;
  const normalized = normalizeBrandKit(raw);
  try {
    if (JSON.stringify(raw) !== JSON.stringify(normalized)) {
      localStorage.setItem(BRAND_KIT_KEY, JSON.stringify(normalized));
    }
  } catch {
    /* quota / private mode */
  }
}

/** Merge with existing profile data so nothing stored under vesper-brand-kit is dropped. */
export function saveBrandKit(updates: Partial<BrandKit>): void {
  if (typeof window === 'undefined') return;
  const existing = readRawBrandKit() ?? {};
  const merged = normalizeBrandKit({ ...existing, ...updates });
  localStorage.setItem(BRAND_KIT_KEY, JSON.stringify(merged));
}
