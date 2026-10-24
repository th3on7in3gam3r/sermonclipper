'use client';

import { useCallback, useEffect, useState } from 'react';
import { resolveClientPlaybackUrl } from '@/lib/resolvePlaybackUrl';

/**
 * Resolves private storage → a presigned playback URL. Waits for auth so
 * /api/video-url succeeds; `refresh` re-resolves after a URL expires.
 */
export function usePlayableVideo(source: string | null, isLoaded: boolean, userId: string | null | undefined) {
  const [resolved, setResolved] = useState<{ source: string; url: string | null } | null>(null);

  useEffect(() => {
    if (!isLoaded || !userId || !source) return;
    let cancelled = false;
    resolveClientPlaybackUrl(source)
      .then((url) => !cancelled && setResolved({ source, url }))
      .catch(() => !cancelled && setResolved({ source, url: null }));
    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, source]);

  const refresh = useCallback(async () => {
    if (!source || !userId) return null;
    try {
      const url = await resolveClientPlaybackUrl(source);
      setResolved({ source, url });
      return url;
    } catch {
      setResolved({ source, url: null });
      return null;
    }
  }, [source, userId]);

  // Never show a URL resolved for a previous source.
  const playableVideoUrl = source && resolved?.source === source ? resolved.url : null;
  return { playableVideoUrl, refreshPlayableUrl: refresh };
}
