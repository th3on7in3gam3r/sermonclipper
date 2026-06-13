import { ImageResponse } from 'next/og';
import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/siteConfig';

export const runtime = 'edge';
export const alt = SITE_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px 80px',
          background: 'linear-gradient(135deg, #0A0A0F 0%, #1a1030 45%, #0A0A0F 100%)',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: '0.35em',
            color: '#A78BFA',
            marginBottom: 24,
          }}
        >
          VESPER STUDIO
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            maxWidth: 900,
            marginBottom: 28,
          }}
        >
          Cinematic Sermon Reels for Churches
        </div>
        <div style={{ fontSize: 28, lineHeight: 1.45, color: '#C4B5FD', maxWidth: 880 }}>
          {SITE_DESCRIPTION}
        </div>
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            gap: 16,
            fontSize: 22,
            color: '#71717A',
            fontWeight: 700,
          }}
        >
          <span>Instagram</span>
          <span>·</span>
          <span>TikTok</span>
          <span>·</span>
          <span>YouTube Shorts</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
