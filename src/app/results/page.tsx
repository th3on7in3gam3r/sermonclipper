'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

function ResultsContent() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get('videoUrl');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (videoUrl) {
      navigator.clipboard.writeText(videoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="animate-up" style={{ width: '100%', maxWidth: '1200px', padding: '0 20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '64px', borderBottom: '1px solid #222228', paddingBottom: '32px' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '48px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.04em', lineHeight: 1 }}>
            Sermon <span style={{ color: '#8B5CF6' }}>Results</span>
          </h1>
          <p style={{ color: '#A1A1AA', fontSize: '18px', fontWeight: 300, marginTop: '8px' }}>Neural harvesting complete. Clips are ready for social.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={handleCopy}
            className="platinum-btn"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #222', fontSize: '11px', flex: 1 }}
          >
            {copied ? 'Copied Link' : 'Copy Session Link'}
          </button>
          <a 
            href={videoUrl || '#'} 
            download
            className="platinum-btn"
            style={{ fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flex: 1 }}
          >
            Download Master
          </a>
        </div>
      </div>

      {/* Clips Grid */}
      <div className="dashboard-grid">
        {/* Main Session Clip */}
        <div className="clip-card">
          <div className="clip-preview">
            {videoUrl ? (
              <video style={{ width: '100%', height: '100%', objectCover: 'cover' }} src={videoUrl} controls></video>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
                <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Feed Loading...</p>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: '100px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Full Session</div>
          </div>
          <div className="clip-info">
            <h3 style={{ fontWeight: 900, fontSize: '18px', marginBottom: '8px', letterSpacing: '-0.01em' }}>Master Sermon Session</h3>
            <p style={{ color: '#555', fontSize: '12px', lineHeight: 1.6 }}>High-resolution session capture. Perfect for full-length archiving.</p>
          </div>
        </div>

        {/* Social Clip Placeholders */}
        {[1, 2].map((i) => (
          <div key={i} className="clip-card" style={{ opacity: 0.4 }}>
            <div className="clip-preview vertical" style={{ background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎬</div>
                <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.3 }}>Harvesting {i}...</p>
              </div>
            </div>
            <div className="clip-info">
              <div style={{ height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '12px' }} />
              <div style={{ height: '14px', width: '60%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', color: '#333', marginTop: '96px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em' }}>
        Professional Suite · Ironclad Build 2.8
      </p>
    </div>
  );
}

export default function Results() {
  return (
    <main style={{ minHeight: '100vh', padding: '64px 20px', display: 'flex', justifyContent: 'center' }}>
      <div className="spiritual-rays" />
      <Suspense fallback={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '24px' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #8B5CF6', borderTopColor: 'transparent', borderRadius: '100px', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5em', color: '#555' }}>Synchronizing Neural Dashboard...</p>
        </div>
      }>
        <ResultsContent />
      </Suspense>
    </main>
  );
}
