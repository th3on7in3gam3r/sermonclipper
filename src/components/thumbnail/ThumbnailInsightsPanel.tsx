'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type ThumbnailVariant = {
  id: string;
  imageUrl: string;
  ctr: number;
  views: number;
  isWinner?: boolean;
};

type InsightsPayload = {
  aggregateInsight: string | null;
  variants: ThumbnailVariant[];
  youtubeConnected: boolean;
};

interface ThumbnailInsightsPanelProps {
  clipIndex: number;
}

export default function ThumbnailInsightsPanel({ clipIndex }: ThumbnailInsightsPanelProps) {
  const [data, setData] = useState<InsightsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetch(`/api/youtube/thumbnail-insights?clipIndex=${clipIndex}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [clipIndex]);

  const applyWinningStyle = async () => {
    setApplying(true);
    try {
      const res = await fetch('/api/youtube/thumbnail-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipIndex }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.defaultThumbnailStyle && typeof window !== 'undefined') {
          const { saveBrandKit } = await import('@/lib/studio/brandKit');
          saveBrandKit(json.defaultThumbnailStyle as Record<string, unknown>);
        }
        toast.success(json.message || 'Winning style saved to Brand Kit.');
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <p className="thumb-filmstrip-loading">Loading YouTube performance data…</p>;
  }

  if (!data?.youtubeConnected) {
    return (
      <p className="thumb-insights-empty">
        Connect your YouTube channel in Account Settings to see thumbnail click-through insights.
      </p>
    );
  }

  return (
    <div className="thumb-insights">
      {data.aggregateInsight && (
        <div className="thumb-insights-aggregate glass-card">{data.aggregateInsight}</div>
      )}

      {data.variants.length === 0 ? (
        <p className="thumb-insights-empty">
          Publish clips to YouTube with different thumbnails to compare performance here.
        </p>
      ) : (
        <div className="thumb-insights-grid">
          {data.variants.map((v, i) => (
            <div key={v.id} className={`thumb-insights-card glass-card${v.isWinner ? ' thumb-insights-card--winner' : ''}`}>
              {v.isWinner && <span className="thumb-insights-winner">Winner</span>}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.imageUrl} alt={`Thumbnail ${String.fromCharCode(65 + i)}`} />
              <p className="thumb-insights-label">Thumbnail {String.fromCharCode(65 + i)}</p>
              <p className="thumb-insights-stat">CTR: {(v.ctr * 100).toFixed(1)}%</p>
              <p className="thumb-insights-stat">{v.views.toLocaleString()} views</p>
            </div>
          ))}
        </div>
      )}

      {data.variants.some((v) => v.isWinner) && (
        <button
          type="button"
          className="vesper-btn vesper-btn-primary"
          disabled={applying}
          onClick={applyWinningStyle}
        >
          Apply winning style to future thumbnails
        </button>
      )}
    </div>
  );
}
