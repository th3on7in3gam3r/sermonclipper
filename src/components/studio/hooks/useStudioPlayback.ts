'use client';

import { useCallback, useEffect, useState } from 'react';
import { resolveClientPlaybackUrl } from '@/lib/resolvePlaybackUrl';

type Params = {
  /** Already-resolved URL from the results page, when it has one. */
  playableVideoUrl: string | null;
  /** Raw storage URL/key to resolve when the parent hasn't yet. */
  videoUrl: string | null;
  /** YouTube sources play through an embed, not a resolved URL. */
  videoId: string | null;
  authLoaded: boolean;
  userId: string | null | undefined;
};

/** Playback URL for the studio preview, resolving auth-gated storage when needed. */
export function useStudioPlayback({ playableVideoUrl, videoUrl, videoId, authLoaded, userId }: Params) {
  const [resolved, setResolved] = useState<{ source: string; url: string | null } | null>(null);

  const needsResolve = !playableVideoUrl && !videoId && Boolean(videoUrl);

  useEffect(() => {
    if (!needsResolve || !authLoaded || !userId || !videoUrl) return;
    let cancelled = false;
    resolveClientPlaybackUrl(videoUrl)
      .then((url) => !cancelled && setResolved({ source: videoUrl, url }))
      .catch(() => !cancelled && setResolved({ source: videoUrl, url: null }));
    return () => {
      cancelled = true;
    };
  }, [needsResolve, authLoaded, userId, videoUrl]);

  /** Re-resolve after a presigned URL expires. */
  const refresh = useCallback(async () => {
    const source = videoUrl || playableVideoUrl;
    if (!source || videoId) return null;
    try {
      const url = await resolveClientPlaybackUrl(source);
      setResolved({ source, url });
      return url;
    } catch {
      setResolved({ source, url: null });
      return null;
    }
  }, [videoUrl, playableVideoUrl, videoId]);

  const refreshed = resolved && (resolved.source === videoUrl || resolved.source === playableVideoUrl) ? resolved.url : null;
  const playbackUrl = videoId ? null : refreshed ?? playableVideoUrl ?? null;

  return { playbackUrl, refresh };
}
