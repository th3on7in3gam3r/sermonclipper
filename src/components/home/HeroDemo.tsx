'use client';

interface HeroDemoProps {
  isMobile: boolean;
}

const CAPTIONS = [
  'Your breakthrough is closer than you think.',
  'God is still writing your story.',
  'Walk by faith, not by sight.',
];

export default function HeroDemo({ isMobile }: HeroDemoProps) {
  return (
    <div
      className="hero-demo-shell glass-card premium-border animate-in"
      style={{
        maxWidth: '980px',
        margin: '0 auto 56px',
        padding: isMobile ? '20px 16px' : '28px 32px',
        borderRadius: '28px',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(10,10,15,0.6) 100%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '20px' : '28px',
        }}
      >
        {/* Before: full sermon */}
        <div style={{ flex: isMobile ? undefined : 1, width: isMobile ? '100%' : 'auto', maxWidth: '360px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '10px', letterSpacing: '0.06em' }}>
            Before · Full sermon
          </div>
          <div
            className="hero-demo-before"
            style={{
              aspectRatio: '16/9',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#0d0d12',
              position: 'relative',
            }}
          >
            <div className="hero-demo-waveform">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="hero-demo-bar" style={{ animationDelay: `${i * 0.09}s` }} />
              ))}
            </div>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'flex-end',
                padding: '12px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent 55%)',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>45:00 sermon · single platform</span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="hero-demo-arrow" aria-hidden style={{ fontSize: isMobile ? '28px' : '36px', color: '#8B5CF6', flexShrink: 0 }}>
          {isMobile ? '↓' : '→'}
        </div>

        {/* After: cinematic reel */}
        <div style={{ flex: isMobile ? undefined : '0 0 auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#A78BFA', marginBottom: '10px', letterSpacing: '0.06em' }}>
            After · Cinematic reel
          </div>
          <div
            className="hero-demo-phone"
            style={{
              width: isMobile ? '160px' : '180px',
              margin: isMobile ? '0 auto' : undefined,
              aspectRatio: '9/16',
              borderRadius: '22px',
              overflow: 'hidden',
              border: '2px solid rgba(139,92,246,0.45)',
              boxShadow: '0 0 40px rgba(139,92,246,0.25), inset 0 0 30px rgba(139,92,246,0.08)',
              background: '#000',
              position: 'relative',
            }}
          >
            <div className="hero-demo-reel-bg" />
            <div className="hero-demo-scanline" />
            {CAPTIONS.map((caption, i) => (
              <div
                key={caption}
                className="hero-demo-caption"
                style={{ animationDelay: `${i * 2.4}s` }}
              >
                {caption}
              </div>
            ))}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                right: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '9px',
                fontWeight: 800,
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              <span>9:16</span>
              <span className="vesper-badge badge-violet" style={{ padding: '2px 8px', fontSize: '8px' }}>REEL</span>
            </div>
          </div>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: '20px', marginBottom: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
        Vesper finds the moment, styles the caption, and exports a vertical reel — automatically.
      </p>
    </div>
  );
}
