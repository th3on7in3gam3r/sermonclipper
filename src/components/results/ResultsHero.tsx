type Props = {
  isMobile: boolean;
  isYouTubeSource: boolean;
  sermonTitle?: string;
  mainTheme?: string;
  onBatchExport: () => void;
};

export default function ResultsHero({ isMobile, isYouTubeSource, sermonTitle, mainTheme, onBatchExport }: Props) {
  return (
    <div
      className="glass-card premium-border"
      style={{ padding: isMobile ? '32px 24px' : 64, marginBottom: 64, overflow: 'hidden' }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {isYouTubeSource && (
          <div
            className="vesper-badge badge-gold"
            style={{ marginBottom: 24, padding: '12px 20px', width: '100%', justifyContent: 'flex-start', borderRadius: 16 }}
          >
            <span style={{ fontSize: 18 }} aria-hidden>
              📺
            </span>
            <div style={{ marginLeft: 12 }}>
              <p style={{ fontWeight: 900, marginBottom: 2 }}>YOUTUBE PREVIEW MODE</p>
              <p style={{ textTransform: 'none', fontWeight: 400, opacity: 0.8 }}>
                Export requires a direct MP4 upload. AI analysis remains fully active.
              </p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 40 }}>
          <div style={{ flex: '1 1 600px' }}>
            <div className="vesper-badge badge-violet" style={{ marginBottom: 24 }}>
              <div
                aria-hidden
                style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 10px currentColor' }}
              />
              ANALYSIS COMPLETE
            </div>
            <h1 className="title-xl gradient-text" style={{ marginBottom: 24 }}>
              {sermonTitle || 'HARVESTING...'}
              <br />
              <span className="accent-text">RESULTS</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 18, maxWidth: 640, lineHeight: 1.6, fontWeight: 400 }}>
              {mainTheme || 'Distilling the essence of your message into high-impact cinematic reels.'}
            </p>
          </div>

          {!isYouTubeSource && (
            <div style={{ width: isMobile ? '100%' : 280 }}>
              <button
                type="button"
                onClick={onBatchExport}
                className="vesper-btn vesper-btn-primary shimmer-effect"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  padding: '14px 20px',
                  fontSize: 13,
                }}
              >
                BATCH EXPORT ALL CLIPS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ToolCard({
  title,
  desc,
  onClick,
  loading,
  icon,
}: {
  title: string;
  desc: string;
  onClick?: () => void;
  loading?: boolean;
  icon: string;
}) {
  const disabled = loading || !onClick;
  return (
    <div
      className="glass-card premium-border"
      style={{ padding: 32, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }} aria-hidden>
        {icon}
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 900 }}>{title}</h3>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, flex: 1 }}>{desc}</p>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="vesper-btn vesper-btn-outline shimmer-effect"
        style={{ width: '100%', opacity: disabled ? 0.5 : 1 }}
      >
        {loading ? 'GENERATING...' : `ACTIVATE ${title.toUpperCase()}`}
      </button>
    </div>
  );
}
