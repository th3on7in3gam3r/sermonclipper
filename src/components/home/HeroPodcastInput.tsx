'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { queueProcessingJob } from '@/lib/clientJobs';

type Episode = {
  guid: string;
  title: string;
  publishedAt: string;
  durationSeconds: number | null;
  speaker: string | null;
  audioUrl: string;
};

type Props = {
  isMobile: boolean;
  onProcessingStart: (jobId: string) => void;
};

export default function HeroPodcastInput({ isMobile, onProcessingStart }: Props) {
  const [feedUrl, setFeedUrl] = useState('');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [feedTitle, setFeedTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [autoProcess, setAutoProcess] = useState(false);

  const loadFeed = async () => {
    if (!feedUrl.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/podcast/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedUrl: feedUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse feed');
      setEpisodes(data.episodes || []);
      setFeedTitle(data.feedTitle || 'Podcast');
      setSelected(new Set());
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not load feed');
    } finally {
      setLoading(false);
    }
  };

  const processSelected = async () => {
    const picks = episodes.filter((e) => selected.has(e.guid));
    if (picks.length === 0) return toast.error('Select at least one episode');

    if (autoProcess) {
      await fetch('/api/podcast/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedUrl: feedUrl.trim(), title: feedTitle, autoProcess: true }),
      });
    }

    for (const episode of picks) {
      const jobId = Math.random().toString(36).substring(7);
      onProcessingStart(jobId);
      const queued = await queueProcessingJob('youtube', { url: episode.audioUrl, jobId });
      if ('error' in queued) {
        toast.error(queued.error);
        return;
      }
      toast.success(`Processing "${episode.title}"`);
      break;
    }
  };

  return (
    <div className="hero-youtube-section">
      <div className="hero-youtube-divider" aria-hidden="true">
        <span className="hero-youtube-divider-line" />
        <span className="hero-youtube-divider-label">OR</span>
        <span className="hero-youtube-divider-line" />
      </div>

      <div className="hero-youtube-card glass-card">
        <label htmlFor="podcast-feed-input" className="hero-youtube-label">
          Podcast RSS Feed
        </label>
        <div className={`hero-youtube-row${isMobile ? ' hero-youtube-row--stack' : ''}`}>
          <input
            id="podcast-feed-input"
            type="url"
            placeholder="https://feeds.buzzsprout.com/…"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            className="hero-youtube-input"
          />
          <button
            type="button"
            onClick={() => void loadFeed()}
            disabled={loading || !feedUrl.trim()}
            className="vesper-btn vesper-btn-outline shimmer-effect hero-youtube-btn"
          >
            {loading ? 'Loading…' : 'Load episodes'}
          </button>
        </div>

        {episodes.length > 0 && (
          <>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '16px 0 8px' }}>{feedTitle}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
              {episodes.map((ep) => (
                <label
                  key={ep.guid}
                  className="glass-card"
                  style={{ display: 'flex', gap: '10px', padding: '10px', cursor: 'pointer', alignItems: 'flex-start' }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(ep.guid)}
                    onChange={(e) => {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(ep.guid);
                        else next.delete(ep.guid);
                        return next;
                      });
                    }}
                  />
                  <span>
                    <strong style={{ display: 'block', fontSize: '14px' }}>{ep.title}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {ep.publishedAt}
                      {ep.speaker ? ` · ${ep.speaker}` : ''}
                      {ep.durationSeconds ? ` · ${Math.round(ep.durationSeconds / 60)} min` : ''}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <label style={{ display: 'flex', gap: '8px', marginTop: '12px', fontSize: '13px' }}>
              <input type="checkbox" checked={autoProcess} onChange={(e) => setAutoProcess(e.target.checked)} />
              Auto-process new episodes daily
            </label>
            <button
              type="button"
              className="vesper-btn vesper-btn-primary shimmer-effect"
              style={{ marginTop: '12px', width: '100%' }}
              onClick={() => void processSelected()}
            >
              Process selected episode
            </button>
          </>
        )}
      </div>
    </div>
  );
}
