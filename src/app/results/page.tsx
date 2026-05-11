'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useAuth, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import toast from 'react-hot-toast';

function ResultsContent() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get('videoUrl');
  const jobId = searchParams.get('jobId');
  const [analysis, setAnalysis] = useState<any>(null);
  const [rendering, setRendering] = useState<{ [key: number]: { status: string, url?: string } }>({});
  const { isLoaded, userId } = useAuth();
  
  // Carousel State
  const [carouselLoading, setCarouselLoading] = useState(false);
  const [carouselData, setCarouselData] = useState<any>(null);
  const [showCarouselModal, setShowCarouselModal] = useState(false);

  const handleGenerateCarousel = async () => {
    if (carouselData) {
      setShowCarouselModal(true);
      return;
    }
    
    setCarouselLoading(true);
    const loadToast = toast.loading('Generating AI Social Carousel...');
    
    try {
      const res = await fetch('/api/social-carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });
      const data = await res.json();
      
      if (data.slides) {
        setCarouselData(data);
        setShowCarouselModal(true);
        toast.success('Carousel Generated!', { id: loadToast });
      } else {
        toast.error('Failed to generate carousel.', { id: loadToast });
      }
    } catch (e) {
      toast.error('Network error.', { id: loadToast });
    } finally {
      setCarouselLoading(false);
    }
  };

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
    <div className="animate-up" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Cinematic Navigation */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', zIndex: 1000, background: 'rgba(10, 10, 15, 0.8)', backdropFilter: 'blur(30px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.4em', color: '#fff' }}>
            VESPER
          </div>
        </Link>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {isLoaded && userId ? (
            <>
              <Link href="/dashboard" style={{ textDecoration: 'none', fontSize: '12px', fontWeight: 800, color: '#A1A1AA', letterSpacing: '0.1em' }}>ARCHIVE</Link>
              <UserButton />
            </>
          ) : (
            <SignInButton mode="modal">
              <button className="shimmer-btn" style={{ padding: '10px 24px', fontSize: '11px' }}>SIGN IN</button>
            </SignInButton>
          )}
        </div>
      </header>

      {/* Hero Metadata Section */}
      <div className="glass-panel" style={{ padding: '60px 40px', marginTop: '140px', marginBottom: '60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)', zIndex: 0 }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h1 style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {analysis?.sermon_title || 'PROCESSING...'} <br/>
                <span style={{ color: '#8B5CF6' }}>RESULTS</span>
              </h1>
              <p style={{ color: '#A1A1AA', fontSize: '18px', marginTop: '20px', maxWidth: '600px', lineHeight: 1.6 }}>
                {analysis?.main_theme || 'Harvesting deep insights from your sermon session...'}
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '240px' }}>
              <button onClick={handleCopy} className="shimmer-btn" style={{ width: '100%', padding: '16px' }}>
                COPY SESSION LINK
              </button>
              <a href={videoUrl || '#'} download className="glass-panel" style={{ width: '100%', padding: '16px', textAlign: 'center', textDecoration: 'none', color: '#fff', fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', background: 'rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                DOWNLOAD MASTER
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: '0' }}>
        {/* Master Sermon Card */}
        <div className="clip-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="clip-preview" style={{ background: '#000', borderRadius: '0' }}>
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
            <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(139, 92, 246, 0.9)', color: '#fff', padding: '4px 16px', borderRadius: '99px', fontSize: '10px', fontWeight: 900, letterSpacing: '0.1em' }}>MASTER SESSION</div>
          </div>
          <div className="clip-info">
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>Full Sermon Context</h3>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#A1A1AA' }}>{analysis?.summary || 'The complete cinematic capture of your ministry session.'}</p>
          </div>
        </div>

        {/* Generated Clips */}
        {analysis?.clips && analysis.clips.length > 0 ? (
          analysis.clips.map((clip: any, i: number) => (
            <div key={i} className="clip-card animate-up" style={{ animationDelay: `${i * 0.1}s`, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="clip-preview" style={{ background: '#000', borderRadius: '0' }}>
                {videoId ? (
                  <iframe
                    style={{ width: '100%', height: '100%', border: 'none' }}
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
                <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 16px', borderRadius: '99px', fontSize: '10px', fontWeight: 900, letterSpacing: '0.1em', backdropFilter: 'blur(10px)' }}>NEURAL CLIP {i+1}</div>
              </div>
              <div className="clip-info">
                <h4 style={{ color: '#8B5CF6', fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>{clip.hook_title}</h4>
                <p style={{ fontStyle: 'italic', color: '#fff', fontSize: '15px', lineHeight: 1.5 }}>"{clip.main_quote}"</p>
              </div>
              <div style={{ padding: '0 24px 24px' }}>
                {rendering[i]?.status === 'loading' ? (
                  <button className="shimmer-btn" style={{ width: '100%', opacity: 0.7, cursor: 'wait', padding: '14px' }} disabled>
                    RENDERING...
                  </button>
                ) : rendering[i]?.status === 'complete' ? (
                  <a href={rendering[i].url} download target="_blank" className="shimmer-btn" style={{ display: 'block', width: '100%', textAlign: 'center', background: 'linear-gradient(90deg, #10B981, #34D399)', textDecoration: 'none', padding: '14px' }}>
                    DOWNLOAD REEL
                  </a>
                ) : (
                  <button onClick={() => handleRender(clip, i)} className="shimmer-btn" style={{ width: '100%', padding: '14px' }}>
                    PROCESS REEL
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          [1, 2].map(i => (
            <div key={i} className="clip-card" style={{ opacity: 0.3, background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ padding: '100px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '0.2em' }}>NEURAL HARVESTING...</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pro Tools Section */}
      <div className="animate-up" style={{ marginTop: '120px', marginBottom: '100px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: '60px' }}>
          EXPAND YOUR <span style={{ color: '#8B5CF6' }}>MINISTRY</span>
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <ToolCard 
            title="Social Carousel" 
            desc="Neural-generated multi-slide series for Instagram and LinkedIn." 
            onClick={handleGenerateCarousel}
            loading={carouselLoading}
          />
          <ToolCard 
            title="Sermon Summaries" 
            desc="Long-form breakdowns and YouTube descriptions ready to post." 
          />
          <ToolCard 
            title="Quote Vault" 
            desc="A collection of the most impactful 20 quotes for daily sharing." 
          />
        </div>
      </div>

      {/* PWA / Link Footer */}
      <footer style={{ padding: '80px 0', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', fontSize: '11px', fontWeight: 900, letterSpacing: '0.2em', opacity: 0.5 }}>
          <Link href="/privacy" style={{ color: '#fff', textDecoration: 'none' }}>PRIVACY</Link>
          <Link href="/terms" style={{ color: '#fff', textDecoration: 'none' }}>TERMS</Link>
          <span style={{ color: '#fff' }}>© 2026 VESPER</span>
        </div>
      </footer>

      {showCarouselModal && carouselData && (
        <CarouselModal data={carouselData} onClose={() => setShowCarouselModal(false)} />
      )}
    </div>
  );
}

function ToolCard({ title, desc, onClick, loading }: any) {
  return (
    <div className="glass-panel" style={{ padding: '40px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'all 0.3s' }}>
      <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>{title}</h3>
      <p style={{ fontSize: '15px', color: '#A1A1AA', lineHeight: 1.6, flex: 1 }}>{desc}</p>
      <button 
        onClick={onClick} 
        disabled={loading}
        className="shimmer-btn" 
        style={{ width: '100%', padding: '12px', fontSize: '11px', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'GENERATING...' : `ACTIVATE ${title.toUpperCase()}`}
      </button>
    </div>
  );
}

function CarouselModal({ data, onClose }: any) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div className="animate-up glass-panel" style={{ padding: '60px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>Kingdom <span style={{ color: '#8B5CF6' }}>Carousel</span></h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '32px', cursor: 'pointer', opacity: 0.5 }}>✕</button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '48px' }}>
          {data.slides.map((slide: any) => (
            <div key={slide.slide_number} className="glass-panel" style={{ padding: '32px', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: '10px', color: '#8B5CF6', fontWeight: 900, marginBottom: '16px', letterSpacing: '0.2em' }}>SLIDE {slide.slide_number}</div>
              <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', lineHeight: 1.2 }}>{slide.heading}</h4>
              <p style={{ fontSize: '14px', color: '#A1A1AA', lineHeight: 1.6 }}>{slide.content}</p>
            </div>
          ))}
        </div>

        <div className="glass-panel" style={{ padding: '40px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 900, marginBottom: '16px', color: '#8B5CF6', letterSpacing: '0.2em' }}>OPTIMIZED CAPTION</h4>
          <p style={{ fontSize: '15px', color: '#fff', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{data.post_caption}</p>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(data.post_caption);
              toast.success('Caption copied!');
            }}
            className="shimmer-btn" style={{ marginTop: '32px', padding: '16px 32px', fontSize: '12px' }}
          >
            COPY CAPTION
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Results() {
  return (
    <main style={{ minHeight: '100vh', background: '#0A0A0F', color: '#fff' }}>
      <div className="spiritual-rays" />
      <div className="vesper-bg" style={{ opacity: 0.15 }} />
      <Suspense fallback={null}>
        <ResultsContent />
      </Suspense>
    </main>
  );
}
