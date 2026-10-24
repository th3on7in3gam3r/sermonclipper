'use client';

interface SermonContextCardProps {
  summary?: string;
  videoUrl: string | null;
  playableVideoUrl?: string | null;
  videoId: string | null;
  masterDownloadUrl?: string | null;
  isMobile: boolean;
  isDownloadingMaster?: boolean;
  onCopyLink: () => void;
  onOpenDescription: () => void;
  onDownloadMaster?: () => void;
}

export default function SermonContextCard({
  summary,
  videoUrl,
  playableVideoUrl,
  videoId,
  masterDownloadUrl,
  isMobile,
  isDownloadingMaster = false,
  onCopyLink,
  onOpenDescription,
  onDownloadMaster,
}: SermonContextCardProps) {
  const playbackSrc = playableVideoUrl || videoUrl;
  const isYouTube = Boolean(videoId);
  const sourceHref = isYouTube ? `https://www.youtube.com/watch?v=${videoId}` : videoUrl || '#';
  const canDownloadMaster = Boolean(masterDownloadUrl && onDownloadMaster);

  return (
    <div className="glass-card premium-border animate-in" style={{ overflow: 'hidden' }}>
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
        {videoId ? (
          <iframe
            style={{ width: '100%', height: '100%', border: 'none' }}
            src={`https://www.youtube.com/embed/${videoId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Sermon source video"
          />
        ) : (
          playbackSrc && (
            <video
              src={playbackSrc}
              controls
              preload="metadata"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )
        )}
        <div
          className="vesper-badge badge-violet"
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            zIndex: 10,
            backdropFilter: 'blur(8px)',
            background: 'rgb(var(--primary-rgb) / 0.8)',
            color: 'var(--text-main)',
          }}
        >
          Full sermon
        </div>
      </div>

      <div style={{ padding: isMobile ? '20px' : '28px' }}>
        <div className="vesper-badge badge-violet" style={{ marginBottom: '12px' }}>
          Summary
        </div>
        <h3 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, marginBottom: '12px' }}>
          About this sermon
        </h3>
        <p
          style={{
            fontSize: isMobile ? '15px' : '16px',
            lineHeight: 1.6,
            color: 'var(--text-muted)',
            marginBottom: '20px',
          }}
        >
          {summary || 'The complete cinematic capture of your ministry session.'}
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={onCopyLink}
            className="vesper-btn vesper-btn-outline"
            style={{
              flex: isMobile ? undefined : '1 1 140px',
              padding: '12px 16px',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.01em',
            }}
          >
            Copy page link
          </button>

          {canDownloadMaster ? (
            <button
              type="button"
              onClick={onDownloadMaster}
              disabled={isDownloadingMaster}
              className="vesper-btn vesper-btn-outline"
              style={{
                flex: isMobile ? undefined : '1 1 140px',
                padding: '12px 16px',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.01em',
                opacity: isDownloadingMaster ? 0.6 : 1,
              }}
            >
              {isDownloadingMaster ? 'Preparing…' : 'Download full sermon'}
            </button>
          ) : isYouTube ? (
            <a
              href={sourceHref}
              target="_blank"
              rel="noreferrer"
              className="vesper-btn vesper-btn-outline"
              style={{
                flex: isMobile ? undefined : '1 1 140px',
                padding: '12px 16px',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.01em',
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              Open on YouTube
            </a>
          ) : null}

          <button
            type="button"
            onClick={onOpenDescription}
            className="vesper-btn vesper-btn-outline"
            style={{
              flex: isMobile ? undefined : '1 1 140px',
              padding: '12px 16px',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.01em',
              color: 'var(--primary)',
              borderColor: 'var(--primary-glow)',
            }}
          >
            YouTube description
          </button>
        </div>
      </div>
    </div>
  );
}
