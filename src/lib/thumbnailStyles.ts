export const THUMB_STYLES = [
  {
    id: 'cinematic',
    name: 'Cinematic',
    icon: '🎬',
    prompt: 'cinematic lighting, dramatic shadows, epic atmosphere, professional photography',
  },
  {
    id: 'bold',
    name: 'Bold Impact',
    icon: '⚡',
    prompt: 'bright vibrant colors, high contrast, massive bold typography, energetic feel',
  },
  {
    id: 'minimal',
    name: 'Minimalist',
    icon: '⚪',
    prompt: 'clean white space, soft lighting, modern minimalist design, light and airy',
  },
] as const;

export type ThumbStyleId = (typeof THUMB_STYLES)[number]['id'];
