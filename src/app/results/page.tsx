'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import toast from 'react-hot-toast';

function ResultsContent() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get('videoUrl');
  const jobId = searchParams.get('jobId');
  const [analysis, setAnalysis] = useState<any>(null);
  const [rendering, setRendering] = useState<{ [key: number]: { status: string, url?: string } }>({});

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

  const handleRender = async (clip: any, index: number) => {
    setRendering(prev => ({ ...prev, [index]: { status: 'loading' } }));
    const renderToastId = toast.loading('Sending clip to FFmpeg Render Engine...');
    
    try {
      const res = await fetch('/api/render-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, clip, index })
      });
      const data = await res.json();
      
      if (data.downloadUrl) {
        setRendering(prev => ({ ...prev, [index]: { status: 'complete', url: data.downloadUrl } }));
        toast.success('Reel successfully rendered!', { id: renderToastId });
      } else {
        console.error('Render failed:', data.error);
        setRendering(prev => ({ ...prev, [index]: { status: 'error' } }));
        toast.error('Failed to render reel. Please try again.', { id: renderToastId });
      }
    } catch (e) {
      console.error('Network error during render:', e);
      setRendering(prev => ({ ...prev, [index]: { status: 'error' } }));
      toast.error('Network error during rendering.', { id: renderToastId });
    }
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
    toast.success('Session link copied to clipboard!');
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
            COPY SESSION LINK
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
                {rendering[i]?.status === 'loading' ? (
                  <button className="platinum-btn" style={{ width: '100%', opacity: 0.7, cursor: 'wait' }} disabled>
                    Rendering Reel... (~30s)
                  </button>
                ) : rendering[i]?.status === 'complete' ? (
                  <a href={rendering[i].url} download target="_blank" className="platinum-btn" style={{ display: 'block', width: '100%', textAlign: 'center', background: '#10B981', color: '#fff', textDecoration: 'none' }}>
                    Download MP4 Reel
                  </a>
                ) : rendering[i]?.status === 'error' ? (
                  <button onClick={() => handleRender(clip, i)} className="platinum-btn" style={{ width: '100%', background: 'rgba(239, 68, 68, 0.2)' }}>
                    Render Failed (Retry)
                  </button>
                ) : (
                  <button onClick={() => handleRender(clip, i)} className="platinum-btn" style={{ width: '100%' }}>
                    Download Reel + Captions
                  </button>
                )}
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

      {/* Premium Features Grid */}
      <div className="animate-up" style={{ marginTop: '96px', marginBottom: '64px' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', textAlign: 'center', marginBottom: '48px' }}>
          Unlock <span style={{ color: '#8B5CF6' }}>Pro Tools</span>
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          {/* Quotes and Verses */}
          <div style={{ padding: '32px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>Quotes and Verses</h3>
            <p style={{ color: '#A1A1AA', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px', flex: 1 }}>
              Quickly extract 20 engaging and inspiring quotes from your sermon, perfect for sharing on your church's social media accounts. Plus, grab every Bible verse reference from the sermon.
            </p>
            <button className="platinum-btn" style={{ width: '100%', fontSize: '12px' }}>Extract Quotes</button>
          </div>

          {/* Sermon Summaries */}
          <div style={{ padding: '32px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>Sermon Summaries</h3>
            <p style={{ color: '#A1A1AA', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px', flex: 1 }}>
              Turn your sermon into various summaries, including short, long, YouTube, and social media versions. Perfect for sharing anywhere.
            </p>
            <button className="platinum-btn" style={{ width: '100%', fontSize: '12px' }}>Generate Summaries</button>
          </div>

          {/* Sermon Transcription */}
          <div style={{ padding: '32px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '24px', border: '1px solid rgba(139, 92, 246, 0.2)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>Sermon Transcription</h3>
            <p style={{ color: '#A1A1AA', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px', flex: 1 }}>
              Get a full transcription of your church service with nearly 99% accuracy. Upload your sermon and receive a precise text version in minutes.
            </p>
            <button className="platinum-btn" style={{ width: '100%', fontSize: '12px' }}>Generate Transcription</button>
          </div>

          {/* Quote Images */}
          <div style={{ padding: '32px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>Quote Images</h3>
            <p style={{ color: '#A1A1AA', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px', flex: 1 }}>
              Create a social media image with a speaker’s photo and engaging quote from the sermon.
            </p>
            <button className="platinum-btn" style={{ width: '100%', fontSize: '12px' }}>Create Image</button>
          </div>

          {/* Thumbnail Images */}
          <div style={{ padding: '32px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>Thumbnail Images</h3>
            <p style={{ color: '#A1A1AA', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px', flex: 1 }}>
              Design an eye-catching thumbnail for YouTube videos or sermon clips.
            </p>
            <button className="platinum-btn" style={{ width: '100%', fontSize: '12px' }}>Design Thumbnail</button>
          </div>

          {/* 5-Day Devotional */}
          <div style={{ padding: '32px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>5-Day Devotional</h3>
            <p style={{ color: '#A1A1AA', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px', flex: 1 }}>
              Transform each sermon into a 5-day devotional series. Each day includes a short read, a thought-provoking question, a verse from the sermon, and an inspiring quote.
            </p>
            <button className="platinum-btn" style={{ width: '100%', fontSize: '12px' }}>Create Devotional</button>
          </div>

          {/* Social Carousel */}
          <div style={{ padding: '32px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>Social Carousel</h3>
            <p style={{ color: '#A1A1AA', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px', flex: 1 }}>
              Each time you create a clip, Sermon Shots automatically generates three AI-powered captions with relevant hashtags. It's now easier than ever to share your content.
            </p>
            <button className="platinum-btn" style={{ width: '100%', fontSize: '12px' }}>View Carousel</button>
          </div>

        </div>
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
