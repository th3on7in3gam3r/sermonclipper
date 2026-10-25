'use client';

import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import type { CarouselData } from '@/lib/results/types';

/** AI social carousel: generated once per page, then reopened from cache. */
export function useSocialCarousel(jobId: string | null) {
  const [data, setData] = useState<CarouselData | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const generate = useCallback(async () => {
    if (data) {
      setOpen(true);
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Generating AI Social Carousel...');
    try {
      const res = await fetch('/api/social-carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const json = await res.json();
      if (json.slides) {
        setData(json);
        setOpen(true);
        toast.success('Carousel Generated!', { id: toastId });
      } else {
        toast.error('Failed to generate carousel.', { id: toastId });
      }
    } catch {
      toast.error('Network error.', { id: toastId });
    } finally {
      setLoading(false);
    }
  }, [data, jobId]);

  return { data, loading, open: open && Boolean(data), generate, close: () => setOpen(false) };
}

/** Download the harvested master MP4 through a short-lived signed URL. */
export function useMasterDownload(masterDownloadUrl: string | null) {
  const [isDownloading, setIsDownloading] = useState(false);

  const download = useCallback(async () => {
    if (!masterDownloadUrl) {
      toast.error('Master MP4 is not available for this session yet.');
      return;
    }
    setIsDownloading(true);
    const toastId = toast.loading('Preparing master download…');
    try {
      const res = await fetch(`/api/master-download?url=${encodeURIComponent(masterDownloadUrl)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Download failed');

      const link = document.createElement('a');
      link.href = data.url;
      link.download = data.filename || 'vesper-master.mp4';
      link.rel = 'noopener';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Master download started', { id: toastId });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not download master video', { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  }, [masterDownloadUrl]);

  return { isDownloading, download };
}

export { copyToClipboard } from '@/lib/clipboard';
