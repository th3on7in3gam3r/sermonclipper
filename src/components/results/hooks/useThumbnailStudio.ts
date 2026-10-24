'use client';

import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { THUMB_STYLES, type ThumbStyleId } from '@/lib/thumbnailStyles';
import type { AnalysisClip, IndexedClip, ThumbnailEntry } from '@/lib/results/types';

/** AI thumbnail generation state for the Thumbnail Studio modal. */
export function useThumbnailStudio() {
  const [thumbnails, setThumbnails] = useState<Record<number, ThumbnailEntry>>({});
  const [activeClip, setActiveClip] = useState<IndexedClip | null>(null);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<ThumbStyleId>('cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

  const open = useCallback((clip: AnalysisClip, index: number) => {
    setActiveClip({ ...clip, index });
    setPrompt(clip.hook_title || '');
    setSelectedVariantIdx(0);
  }, []);

  const close = useCallback(() => setActiveClip(null), []);

  const generate = useCallback(async () => {
    if (!activeClip) return;
    const i = activeClip.index;
    setIsGenerating(true);
    setThumbnails((prev) => ({ ...prev, [i]: { status: 'loading' } }));

    const baseText = `YouTube thumbnail, 16:9 aspect ratio, text overlay saying "${prompt || activeClip.hook_title}", church/faith theme, professional quality, no watermarks`;
    const primary = THUMB_STYLES.find((s) => s.id === style) || THUMB_STYLES[0];
    const ordered = [primary, ...THUMB_STYLES.filter((s) => s.id !== primary.id)];

    try {
      const results = await Promise.allSettled(
        ordered.map((s) =>
          fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: `${baseText}, ${s.prompt}` }),
          }).then((res) => res.json())
        )
      );
      const urls = results
        .filter(
          (r): r is PromiseFulfilledResult<{ success?: boolean; imageUrl: string }> =>
            r.status === 'fulfilled' && Boolean(r.value?.success)
        )
        .map((r) => r.value.imageUrl);

      if (urls.length > 0) {
        setThumbnails((prev) => ({ ...prev, [i]: { status: 'done', url: urls[0], variants: urls } }));
        setSelectedVariantIdx(0);
        toast.success(`Generated ${urls.length} variants! ✦`);
      } else {
        setThumbnails((prev) => ({ ...prev, [i]: { status: 'error' } }));
        toast.error('Thumbnail generation failed.');
      }
    } catch {
      setThumbnails((prev) => ({ ...prev, [i]: { status: 'error' } }));
      toast.error('Network error.');
    } finally {
      setIsGenerating(false);
    }
  }, [activeClip, prompt, style]);

  const setReelCover = useCallback((index: number, url: string) => {
    setThumbnails((prev) => ({
      ...prev,
      [index]: { ...prev[index], status: 'done', reelCoverUrl: url, url: prev[index]?.url || url },
    }));
    toast.success('Reel cover updated');
  }, []);

  const hasAnyThumbnail = Object.values(thumbnails).some((t) => t.status === 'done' && t.url);

  return {
    thumbnails,
    hasAnyThumbnail,
    activeClip,
    open,
    close,
    prompt,
    setPrompt,
    style,
    setStyle,
    isGenerating,
    generate,
    selectedVariantIdx,
    setSelectedVariantIdx,
    setReelCover,
  };
}
