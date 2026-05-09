'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

function ResultsContent() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get('videoUrl');
  const jobId = searchParams.get('jobId');
  const [analysis, setAnalysis] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Helper to extract YouTube Video ID
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = videoUrl ? getYouTubeId(videoUrl) : null;

  // Robust time parser to handle cases where AI returns 'MM:SS' instead of raw seconds
  const parseTime = (timeVal: any): number => {
    if (typeof timeVal === 'number') return Math.floor(timeVal);
    if (!timeVal) return 0;
    const str = String(timeVal);
    if (str.includes(':')) {
      const parts = str.split(':').map(Number);
      if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
      if (parts.length === 2) return parts[0]*60 + parts[1];
    }
    return Math.floor(Number(str)) || 0;
  };

  useEffect(() => {
    if (!jobId) return;

    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/progress?jobId=${jobId}`);
        const data = await res.json();

        if (data?.analysis) {
          setAnalysis(data.analysis);
        } else if (data?.clips) {
          setAnalysis(data);
        }
      } catch (e) {
        console.error('Failed to fetch results:', e);
      }
    };

    fetchResults();
    const interval = setInterval(fetchResults, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-up" style={{ width: '100%', maxWidth: '1200px', padding: '0 20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '64px', borderBottom: '1px solid #222228', paddingBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '48px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.04em' }}>
            {analysis?.sermon_title || 'SERMON'} <span style={{ color: '#8B5CF6' }}>RESULTS</span>
          </h1>
          <p style={{ color: '#A1A1AA', fontSize: '18px', marginTop: '8px' }}>
            {analysis?.main_theme || 'Neural harvesting complete. Clips are ready for social.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={handleCopy} className="platinum-btn" style={{ flex: 1 }}>
            {copied ? '✓ Copied' : 'COPY SESSION LINK'}
          </button>
          <a href={videoUrl || '#'} download className="platinum-btn" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
            DOWNLOAD MASTER
          </a>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Master Sermon */}
        <div className="clip-card">
          <div className="clip-preview" style={{ background: '#000' }}>
            {videoId ? (
              <iframe
                style={{ width: '100%', height: '100%', border: 'none' }}
                src={`https://www.youtube.com/embed/${videoId}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : videoUrl && (
              <video src={videoUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: '999px', fontSize: '10px' }}>FULL SESSION</div>
          </div>
          <div className="clip-info">
            <h3>Master Sermon Session</h3>
            <p>{analysis?.summary || 'High-resolution session capture.'}</p>
          </div>
        </div>

        {/* Generated Clips */}
        {analysis?.clips && analysis.clips.length > 0 ? (
          analysis.clips.map((clip: any, i: number) => (
            <div key={i} className="clip-card animate-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="clip-preview" style={{ background: '#000', position: 'relative' }}>
                {videoId ? (
                  <iframe
                    style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0 }}
                    src={`https://www.youtube.com/embed/${videoId}?start=${parseTime(clip.start)}&end=${parseTime(clip.end)}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : videoUrl && (
                  <video 
                    src={`${videoUrl}#t=${clip.start}`} 
                    controls 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
              <div className="clip-info">
                <h4 style={{ color: '#8B5CF6', marginBottom: '8px' }}>{clip.hook_title}</h4>
                <p style={{ fontStyle: 'italic', color: '#ddd' }}>"{clip.main_quote}"</p>
              </div>
              <div style={{ padding: '0 24px 24px' }}>
                <button className="platinum-btn" style={{ width: '100%' }}>
                  Download Reel + Captions
                </button>
              </div>
            </div>
          ))
        ) : (
          [1, 2, 3].map(i => (
            <div key={i} className="clip-card" style={{ opacity: 0.5 }}>
              <div className="clip-preview" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                  <p style={{ fontSize: '11px', color: '#666' }}>LOADING CLIP {i}...</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sermon Transcription Section */}
      <div className="animate-up" style={{ marginTop: '64px', padding: '64px 48px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '32px', border: '1px solid rgba(139, 92, 246, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#fff', marginBottom: '16px' }}>
          Sermon <span style={{ color: '#8B5CF6' }}>Transcription</span>
        </h2>
        <p style={{ color: '#A1A1AA', fontSize: '18px', maxWidth: '600px', lineHeight: 1.6, marginBottom: '32px' }}>
          Get a full transcription of your church service with nearly 99% accuracy. Upload your sermon and receive a precise text version in minutes.
        </p>
        <button className="platinum-btn" style={{ padding: '16px 48px', fontSize: '14px' }}>
          Generate Transcription
        </button>
      </div>
    </div>
  );
}

export default function Results() {
  return (
    <main style={{ minHeight: '100vh', padding: '64px 20px', display: 'flex', justifyContent: 'center' }}>
      <div className="spiritual-rays" />
      <Suspense fallback={null}>
        <ResultsContent />
      </Suspense>
    </main>
  );
}
