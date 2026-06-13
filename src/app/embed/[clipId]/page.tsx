import { SITE_URL } from '@/lib/siteConfig';

type Props = { params: Promise<{ clipId: string }> };

export async function generateMetadata({ params }: Props) {
  const { clipId } = await params;
  return { title: `Clip | Vesper Embed`, robots: { index: false } };
}

export default async function EmbedPage({ params }: Props) {
  const { clipId } = await params;
  const metaUrl = `${SITE_URL}/api/embed/${encodeURIComponent(clipId)}?meta=1`;

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, background: '#000', fontFamily: 'system-ui, sans-serif' }}>
        <EmbedPlayer clipId={clipId} metaUrl={metaUrl} />
      </body>
    </html>
  );
}

function EmbedPlayer({ clipId, metaUrl }: { clipId: string; metaUrl: string }) {
  return (
    <div id="vesper-embed-root" data-clip-id={clipId} data-meta-url={metaUrl}>
      <video
        id="vesper-embed-video"
        controls
        playsInline
        muted
        autoPlay
        style={{ width: '100%', height: '100dvh', objectFit: 'contain', background: '#000' }}
      />
      <img
        id="vesper-embed-logo"
        alt=""
        style={{
          position: 'fixed',
          top: 12,
          right: 12,
          width: 48,
          height: 48,
          objectFit: 'contain',
          opacity: 0.85,
          display: 'none',
        }}
      />
      <p
        id="vesper-embed-badge"
        style={{
          position: 'fixed',
          bottom: 8,
          right: 8,
          margin: 0,
          fontSize: 10,
          color: 'rgba(255,255,255,0.45)',
        }}
      >
        Powered by Vesper
      </p>
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function(){
  var root=document.getElementById('vesper-embed-root');
  var metaUrl=root.getAttribute('data-meta-url');
  var video=document.getElementById('vesper-embed-video');
  var logo=document.getElementById('vesper-embed-logo');
  var badge=document.getElementById('vesper-embed-badge');
  fetch(metaUrl).then(function(r){return r.json()}).then(function(d){
    if(d.videoUrl) video.src=d.videoUrl;
    if(d.logoUrl){ logo.src=d.logoUrl; logo.style.display='block'; }
    if(!d.showPoweredBy) badge.style.display='none';
  }).catch(function(){});
  video.addEventListener('click',function(){ video.muted=false; });
})();
          `,
        }}
      />
    </div>
  );
}
