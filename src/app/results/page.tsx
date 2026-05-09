'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

interface Clip {
  start: number;
  end: number;
  hook_title: string;
  main_quote: string;
  why_it_works?: string;
  suggested_captions?: string[];
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get('videoUrl');
  const jobId = searchParams.get('jobId');
  const [analysis, setAnalysis] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    const fetchResults = async () => {
      try {
        // 1. Check progress first
        let res = await fetch(`/api/progress?jobId=${jobId}`);
        let data = await res.json();
        
        console.log("📡 Raw Progress data received:", data);

        if (data?.analysis?.clips?.length > 0) {
          setAnalysis(data.analysis);
          setLoading(false);
          return;
        }

        // 2. Call Gemini with POST (Correct method to trigger/check)
        res = await fetch(`/api/fallback-gemini`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            url: videoUrl, 
            jobId 
          })
        });

        if (!res.ok) {
          console.error(`Gemini route returned ${res.status}`);
          return;
        }

        data = await res.json();
        console.log("📡 Raw Gemini data received:", data);

        if (data?.clips?.length > 0 || data?.success) {
          setAnalysis(data.analysis || data);
          setLoading(false);
        }
      } catch (e) {
        console.error('Failed to fetch results:', e);
      }
    };

    fetchResults();
    
    // Poll every 4 seconds
    const interval = setInterval(fetchResults, 4000);

    return () => clearInterval(interval);
  }, [jobId, videoUrl]);

  const handleCopy = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-up" style={{ width: '100%', maxWidth: '1200px', padding: '0 20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '64px', borderBottom: '1px solid #222228', paddingBottom: '32px' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '48px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {analysis?.sermon_title || 'Sermon'} <span style={{ color: '#8B5CF6' }}>Results</span>
          </h1>
          <p style={{ color: '#A1A1AA', fontSize: '18px', fontWeight: 300, marginTop: '8px' }}>
            {analysis?.main_theme || 'Neural harvesting complete. Clips are ready for social.'}
          </p>
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
              <video style={{ width: '100%', height: '100%', objectFit: 'cover' }} src={videoUrl} controls></video>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
                <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Feed Loading...</p>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: '100px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Full Session</div>
          </div>
          <div className="clip-info">
            <h3 style={{ fontWeight: 900, fontSize: '18px', marginBottom: '8px', letterSpacing: '-0.01em' }}>Master Sermon Session</h3>
            <p style={{ color: '#555', fontSize: '12px', lineHeight: 1.6 }}>{analysis?.summary || 'High-resolution session capture. Perfect for full-length archiving.'}</p>
          </div>
        </div>

        {/* Real Dynamic Clips from Gemini */}
        {analysis?.clips && analysis.clips.length > 0 ? (
          analysis.clips.map((clip: Clip, i: number) => (
            <div key={i} className="clip-card animate-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="clip-preview vertical" style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {videoUrl ? (
                  <video 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    src={`${videoUrl}#t=${clip.start}`} 
                    controls 
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '16px' }}>🎬</div>
                    <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8B5CF6' }}>
                      Clip {i + 1}
                    </p>
                    <p style={{ fontSize: '12px', color: '#555', marginTop: '12px' }}>
                      {Math.floor(clip.start / 60)}:{(clip.start % 60).toString().padStart(2, '0')} - {Math.floor(clip.end / 60)}:{(clip.end % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                )}
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(139, 92, 246, 0.9)', padding: '4px 10px', borderRadius: '100px', fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Viral Hook
                </div>
              </div>
              <div className="clip-info" style={{ minHeight: '180px' }}>
                <h4 style={{ fontWeight: 900, fontSize: '16px', color: '#8B5CF6', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{clip.hook_title}</h4>
                <p style={{ color: '#eee', fontSize: '13px', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '16px' }}>"{clip.main_quote}"</p>
              </div>
              <div style={{ padding: '0 24px 24px' }}>
                <button className="platinum-btn" style={{ width: '100%', fontSize: '10px' }}>
                  Download Reel + Captions
                </button>
              </div>
            </div>
          ))
        ) : (
          // Loading placeholders
          [1, 2, 3].map((i) => (
            <div key={i} className="clip-card" style={{ opacity: 0.5 }}>
              <div className="clip-preview vertical" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <p style={{ fontSize: '11px', color: '#666', fontWeight: 900, letterSpacing: '0.2em' }}>HARVESTING CLIP {i}...</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {analysis?.key_verses && (
        <div style={{ marginTop: '96px', padding: '48px', background: 'rgba(139, 92, 246, 0.03)', borderRadius: '32px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', color: '#F4B942' }}>Scriptural Anchors</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {analysis.key_verses.map((verse: string, i: number) => (
              <span key={i} style={{ padding: '8px 20px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>
                {verse}
              </span>
            ))}
          </div>
        </div>
      )}

      <p style={{ textAlign: 'center', color: '#333', marginTop: '96px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em' }}>
        Professional Suite · Ironclad Build 2.13
      </p>
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
