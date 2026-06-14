'use client';

import { useEffect, useState } from 'react';
import { SITE_URL } from '@/lib/siteConfig';

type WatchData = {
  title: string;
  sermonTitle?: string;
  createdAt?: string;
  videoUrl?: string;
  churchName?: string;
  logoUrl?: string;
  website?: string;
  showPoweredBy?: boolean;
};

export default function WatchPlayer({ clipId }: { clipId: string }) {
  const [data, setData] = useState<WatchData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/watch/${encodeURIComponent(clipId)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch(() => setError('Could not load clip'));
  }, [clipId]);

  const share = async () => {
    const url = `${SITE_URL}/watch/${encodeURIComponent(clipId)}`;
    if (navigator.share) {
      await navigator.share({ title: data?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  if (error) {
    return (
      <main style={{ minHeight: '100dvh', background: '#000', color: '#fff', display: 'grid', placeItems: 'center' }}>
        {error}
      </main>
    );
  }

  if (!data) {
    return (
      <main style={{ minHeight: '100dvh', background: '#000', color: '#fff', display: 'grid', placeItems: 'center' }}>
        Loading…
      </main>
    );
  }

  return (
    <main className="watch-page">
      <header className="watch-page-header">
        {data.logoUrl ? <img src={data.logoUrl} alt="" className="watch-page-logo" /> : null}
        <div>
          <h1>{data.churchName || 'Church'}</h1>
          <p>{data.title}</p>
        </div>
      </header>

      <div className="watch-page-player-wrap">
        <video
          src={data.videoUrl}
          controls
          playsInline
          muted
          autoPlay
          preload="metadata"
          className="watch-page-video"
        />
      </div>

      <div className="watch-page-actions">
        <button type="button" className="vesper-btn vesper-btn-primary" onClick={() => void share()}>
          Share
        </button>
        {data.website && (
          <a href={data.website.startsWith('http') ? data.website : `https://${data.website}`} className="vesper-btn-outline">
            Watch full sermon
          </a>
        )}
      </div>

      {data.showPoweredBy !== false && (
        <footer className="watch-page-footer">Powered by Vesper</footer>
      )}
    </main>
  );
}
