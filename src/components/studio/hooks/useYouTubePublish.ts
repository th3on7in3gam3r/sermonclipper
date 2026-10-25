'use client';

import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';

type Params = {
  renderUrl: string | undefined;
  isYouTubeSource: boolean;
  youtubeConnected: boolean;
  title: string;
  description: string;
  clipId: string | null;
  clipIndex: number;
};

/** Publish the exported reel to the user's YouTube channel (connecting first if needed). */
export function useYouTubePublish({
  renderUrl,
  isYouTubeSource,
  youtubeConnected,
  title,
  description,
  clipId,
  clipIndex,
}: Params) {
  const [isPublishing, setIsPublishing] = useState(false);

  const publish = useCallback(async () => {
    if (!renderUrl) {
      toast.error('Export the reel first, then publish it.');
      return;
    }
    if (isYouTubeSource) {
      toast.error('Reels from YouTube links can’t be exported or published.');
      return;
    }

    setIsPublishing(true);
    const toastId = toast.loading('Publishing to YouTube…');
    try {
      if (!youtubeConnected) {
        const authRes = await fetch('/api/youtube/auth');
        const authData = await authRes.json();
        if (authData.url) {
          window.location.href = authData.url;
          return;
        }
      }

      const res = await fetch('/api/youtube/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: renderUrl, title, description, clipId, clipIndex }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      if (clipId && data.youtubeId) {
        await fetch('/api/clips/publication', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clipId,
            platform: 'youtube',
            externalId: data.youtubeId,
            postUrl: `https://youtube.com/shorts/${data.youtubeId}`,
          }),
        });
      }
      toast.success('Published to YouTube Shorts', { id: toastId });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Publishing failed', { id: toastId });
    } finally {
      setIsPublishing(false);
    }
  }, [renderUrl, isYouTubeSource, youtubeConnected, title, description, clipId, clipIndex]);

  return { isPublishing, publish };
}
