/** Studio options aligned with /api/render-clip Shotstack mappings. */

export const STUDIO_TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimalist Prophet',
    desc: 'Clean white subtitles, subtle shadow.',
    color: '#FFFFFF',
    textShadow: '0 2px 8px rgba(0,0,0,0.8)',
    fontStyle: 'normal' as const,
  },
  {
    id: 'cinematic',
    name: 'Cinematic Glory',
    desc: 'Bold yellow, deep shadow overlay.',
    color: '#FFFF00',
    textShadow: '0 4px 20px rgba(0,0,0,1)',
    fontStyle: 'italic' as const,
  },
  {
    id: 'modern',
    name: 'Modern Apostle',
    desc: 'Violet gradient glow, dynamic weight.',
    color: '#C4B5FD',
    textShadow: '0 0 30px rgba(139,92,246,0.6)',
    fontStyle: 'normal' as const,
  },
  {
    id: 'fire',
    name: 'Holy Fire',
    desc: 'Amber glow, bold impact style.',
    color: '#FCD34D',
    textShadow: '0 0 20px rgba(251,146,60,0.8)',
    fontStyle: 'normal' as const,
  },
] as const;

export const STUDIO_FILTERS = [
  { id: 'none', name: 'Original', css: 'none', preview: 'bg-gradient-to-br from-zinc-700 to-zinc-900' },
  { id: 'vintage', name: 'Vintage Grace', css: 'sepia(0.55) contrast(1.15) brightness(0.95)', preview: 'bg-gradient-to-br from-amber-900 to-yellow-800' },
  { id: 'cold', name: 'Cold Truth', css: 'saturate(0.4) brightness(1.1) hue-rotate(200deg)', preview: 'bg-gradient-to-br from-blue-900 to-slate-700' },
  { id: 'warm', name: 'Warm Spirit', css: 'sepia(0.3) saturate(1.4) hue-rotate(15deg)', preview: 'bg-gradient-to-br from-orange-900 to-red-800' },
  { id: 'noir', name: 'Noir Prophet', css: 'grayscale(0.9) contrast(1.3)', preview: 'bg-gradient-to-br from-zinc-900 to-zinc-600' },
  { id: 'glory', name: 'Glory Light', css: 'brightness(1.15) saturate(1.3) contrast(0.95)', preview: 'bg-gradient-to-br from-violet-800 to-purple-600' },
] as const;

export const STUDIO_FONTS = [
  { id: 'outfit', name: 'Outfit', family: "'Outfit', sans-serif", weight: 900, desc: 'Modern & clean.' },
  { id: 'impact', name: 'Impact', family: "Impact, 'Arial Narrow', sans-serif", weight: 900, desc: 'Bold & powerful.' },
  { id: 'georgia', name: 'Georgia', family: 'Georgia, serif', weight: 700, desc: 'Classic & reverent.' },
  { id: 'mono', name: 'Mono', family: "'Courier New', monospace", weight: 700, desc: 'Technical & precise.' },
  { id: 'serif', name: 'Playfair', family: "'Playfair Display', Georgia, serif", weight: 900, desc: 'Elegant & editorial.' },
] as const;

export const STUDIO_ANIMATIONS = [
  { id: 'fade', name: 'Soft Fade', desc: 'Gentle opacity transition.', class: 'animate-studio-fade' },
  { id: 'slideUp', name: 'Slide Up', desc: 'Text rises from below.', class: 'animate-hook-pop' },
  { id: 'zoom', name: 'Zoom', desc: 'Scale in from center.', class: 'animate-studio-zoom' },
  { id: 'carve', name: 'Carve', desc: 'Wipe reveal left to right.', class: 'animate-studio-carve' },
] as const;

export const STUDIO_PLATFORMS = [
  { id: 'tiktok', icon: '📱', label: 'TikTok', format: '9:16 Vertical', limit: 2200, prefix: '#ministry #shorts ' },
  { id: 'insta', icon: '📸', label: 'Instagram', format: '9:16 Reel', limit: 2200, prefix: 'Reel from today: ' },
  { id: 'youtube', icon: '▶️', label: 'YouTube Shorts', format: '9:16 Vertical', limit: 500, prefix: '' },
  { id: 'x', icon: '𝕏', label: 'X', format: '1:1 / 9:16', limit: 280, prefix: 'Powerful moment: ' },
] as const;

export const STUDIO_TABS = [
  { id: 'templates', icon: '◈', label: 'Style' },
  { id: 'filters', icon: '◐', label: 'Filter' },
  { id: 'fonts', icon: 'Aa', label: 'Font' },
  { id: 'motion', icon: '▷', label: 'Motion' },
  { id: 'trim', icon: '✂', label: 'Trim' },
  { id: 'publish', icon: '↗', label: 'Sync' },
] as const;

export const MOBILE_TABS = [
  { id: 'style', label: 'STYLE', icon: '🎨' },
  { id: 'preview', label: 'PREVIEW', icon: '📱' },
  { id: 'social', label: 'SOCIAL', icon: '📋' },
  { id: 'export', label: 'FINISH', icon: '🚀' },
] as const;

export const BRAND_KIT_KEY = 'vesper-brand-kit';

/** Core studio defaults; extra keys from older saves are preserved via spread in brandKit.ts */
export type BrandKit = {
  template: string;
  filter: string;
  font: string;
  animation: string;
} & Record<string, unknown>;
