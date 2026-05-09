'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

function ResultsContent() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get('videoUrl');
  const jobId = searchParams.get('jobId');
  const [analysis, setAnalysis] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const fetchResults = async () => {
      try {
        // 1. Check progress first
        let res = await fetch(`/api/progress?jobId=${jobId}`);
        let data = await res.json();
        
        console.log("📡 Raw Progress data received:", data);

        if (data?.analysis) {
          setAnalysis(data.analysis);
          return;
        } else if (data?.clips) {
          setAnalysis(data);
          return;
        }

        // 2. Call OpenAI fallback to trigger analysis if not ready
        res = await fetch(`/api/fallback-openai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: videoUrl, jobId })
        });

        if (!res.ok) return;

        data = await res.json();
        console.log("📡 Raw OpenAI data received:", data);

        if (data?.analysis) {
          setAnalysis(data.analysis);
        } else if (data?.clips) {
          setAnalysis(data);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchResults();
    const interval = setInterval(fetchResults, 3000);
    return () => clearInterval(interval);
  }, [jobId, videoUrl]);

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
          <div className="clip-preview">
            {videoUrl && <video src={videoUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: '999px', fontSize: '10px' }}>
              FULL SESSION
            </div>
          </div>
          <div className="clip-info">
            <h3>Master Sermon Session</h3>
            <p>{analysis?.summary}</p>
          </div>
        </div>

        {/* Generated Clips */}
        {analysis?.clips?.map((clip: any, i: number) => (
          <div key={i} className="clip-card">
            <div className="clip-preview vertical">
              {videoUrl && (
                <video 
                  src={`${videoUrl}#t=${clip.start}`} 
                  controls 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
            <div className="clip-info">
              <h4 style={{ color: '#8B5CF6' }}>{clip.hook_title}</h4>
              <p style={{ fontStyle: 'italic' }}>"{clip.main_quote}"</p>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              <button className="platinum-btn" style={{ width: '100%' }}>
                Download Reel + Captions
              </button>
            </div>
          </div>
        ))}
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
