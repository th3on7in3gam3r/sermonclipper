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

  const [selectedClip, setSelectedClip] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState('minimal');
  const [selectedFilter, setSelectedFilter] = useState('none');

  const TEMPLATES = [
    { id: 'minimal', name: 'Minimalist Prophet', desc: 'Clean white subtitles, no background', color: '#FFFFFF', fontStyle: 'normal', textShadow: '0 2px 8px rgba(0,0,0,0.8)' },
    { id: 'cinematic', name: 'Cinematic Glory', desc: 'Bold yellow, deep shadow overlay', color: '#FFFF00', fontStyle: 'italic', textShadow: '0 4px 20px rgba(0,0,0,1)' },
    { id: 'modern', name: 'Modern Apostle', desc: 'Violet gradient, dynamic weight', color: '#C4B5FD', fontStyle: 'normal', textShadow: '0 0 30px rgba(139,92,246,0.6)' },
    { id: 'fire', name: 'Holy Fire', desc: 'Amber glow, bold impact style', color: '#FCD34D', fontStyle: 'normal', textShadow: '0 0 20px rgba(251,146,60,0.8)' },
  ];

  const FILTERS = [
    { id: 'none', name: 'Original', css: 'none', preview: 'bg-gradient-to-br from-zinc-700 to-zinc-900' },
    { id: 'vintage', name: 'Vintage Grace', css: 'sepia(0.55) contrast(1.15) brightness(0.95)', preview: 'bg-gradient-to-br from-amber-900 to-yellow-800' },
    { id: 'cold', name: 'Cold Truth', css: 'saturate(0.4) brightness(1.1) hue-rotate(200deg)', preview: 'bg-gradient-to-br from-blue-900 to-slate-700' },
    { id: 'warm', name: 'Warm Spirit', css: 'sepia(0.3) saturate(1.4) hue-rotate(15deg)', preview: 'bg-gradient-to-br from-orange-900 to-red-800' },
    { id: 'noir', name: 'Noir Prophet', css: 'grayscale(0.9) contrast(1.3)', preview: 'bg-gradient-to-br from-zinc-900 to-zinc-600' },
    { id: 'glory', name: 'Glory Light', css: 'brightness(1.15) saturate(1.3) contrast(0.95)', preview: 'bg-gradient-to-br from-violet-800 to-purple-600' },
  ];

  const FONTS = [
    { id: 'outfit', name: 'Outfit', desc: 'Modern & clean', family: "'Outfit', sans-serif", weight: 900 },
    { id: 'impact', name: 'Impact', desc: 'Bold & powerful', family: "Impact, 'Arial Narrow', sans-serif", weight: 900 },
    { id: 'georgia', name: 'Georgia', desc: 'Classic & reverent', family: "Georgia, serif", weight: 700 },
    { id: 'mono', name: 'Mono', desc: 'Technical & precise', family: "'Courier New', monospace", weight: 700 },
    { id: 'serif', name: 'Playfair', desc: 'Elegant & editorial', family: "'Playfair Display', Georgia, serif", weight: 900 },
  ];

  const [selectedFont, setSelectedFont] = useState('outfit');

  const startExport = async (clip: any) => {
    const index = clip.index;
    setRendering(prev => ({ ...prev, [index]: { status: 'loading' } }));
    const renderToastId = toast.loading('Synchronizing with Shotstack Cloud...');
    
    try {
      const res = await fetch('/api/render-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId, 
          clip, 
          index,
          template: selectedTemplate,
          filter: selectedFilter,
          font: selectedFont,
        })
      });
      const data = await res.json();
      
      if (data.shotstackId) {
        toast.loading('Neural rendering in progress...', { id: renderToastId });
        pollStatus(data.shotstackId, index, renderToastId);
      } else {
        setRendering(prev => ({ ...prev, [index]: { status: 'error' } }));
        toast.error('Shotstack failed to queue render.', { id: renderToastId });
      }
    } catch (e) {
      setRendering(prev => ({ ...prev, [index]: { status: 'error' } }));
      toast.error('Network error during rendering.', { id: renderToastId });
    }
  };

  const pollStatus = async (id: string, index: number, toastId: string) => {
    try {
      const res = await fetch(`/api/render-status?id=${id}`);
      const data = await res.json();

      if (data.status === 'done') {
        setRendering(prev => ({ ...prev, [index]: { status: 'complete', url: data.url } }));
        toast.success('Reel successfully rendered!', { id: toastId });
        setSelectedClip(null); // Close studio on success
      } else if (data.status === 'failed') {
        setRendering(prev => ({ ...prev, [index]: { status: 'error' } }));
        toast.error('Cloud render failed.', { id: toastId });
      } else {
        setTimeout(() => pollStatus(id, index, toastId), 3000);
      }
    } catch (e) {
      setRendering(prev => ({ ...prev, [index]: { status: 'error' } }));
    }
  };

  const handleCustomize = (clip: any, index: number) => {
    setSelectedClip({ ...clip, index });
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
      <div className="glass-panel" style={{ padding: '48px 40px', marginTop: '100px', marginBottom: '48px', position: 'relative', overflow: 'hidden' }}>
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
                  <button onClick={() => handleCustomize(clip, i)} className="shimmer-btn" style={{ width: '100%', padding: '14px' }}>
                    CUSTOMIZE REEL
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', color: '#A1A1AA' }}>
            Establishing Neural Link to Sermon Analysis...
          </div>
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

      {/* Vesper Studio Overlay */}
      {selectedClip && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#050508', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}>

          {/* Studio Top Bar */}
          <div style={{ height: '56px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(10,10,15,0.95)', borderBottom: '1px solid rgba(255,255,255,0.07)', zIndex: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#8B5CF6', boxShadow: '0 0 8px #8B5CF6' }} />
              <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.35em', color: '#fff' }}>VESPER STUDIO</span>
              <span style={{ fontSize: '10px', color: '#52525B', letterSpacing: '0.1em' }}>— {selectedClip.hook_title || 'Clip'}</span>
            </div>
            <button
              onClick={() => setSelectedClip(null)}
              style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >✕</button>
          </div>

          {/* Studio Body */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

            {/* Left Panel: Tools */}
            <div style={{ width: '320px', flexShrink: 0, background: 'rgba(10,10,15,0.9)', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Tab Bar */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                {['templates', 'filters', 'fonts'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1, padding: '14px 8px', background: 'none', border: 'none',
                      color: activeTab === tab ? '#fff' : '#52525B',
                      fontSize: '10px', fontWeight: 800, cursor: 'pointer',
                      borderBottom: activeTab === tab ? '2px solid #8B5CF6' : '2px solid transparent',
                      transition: 'all 0.2s', letterSpacing: '0.08em',
                    }}
                  >{tab.toUpperCase()}</button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* TEMPLATES */}
                {activeTab === 'templates' && TEMPLATES.map(t => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    style={{
                      padding: '16px', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s',
                      background: selectedTemplate === t.id ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                      border: selectedTemplate === t.id ? '1px solid rgba(139,92,246,0.6)' : '1px solid rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', gap: '14px',
                    }}
                  >
                    {/* Color swatch */}
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, background: `linear-gradient(135deg, ${t.color}33, ${t.color}88)`, border: `1px solid ${t.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', marginBottom: '3px' }}>{t.name}</div>
                      <div style={{ fontSize: '10px', color: '#71717A', lineHeight: 1.4 }}>{t.desc}</div>
                    </div>
                    {selectedTemplate === t.id && (
                      <div style={{ marginLeft: 'auto', width: '18px', height: '18px', borderRadius: '50%', background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </div>
                ))}

                {/* FILTERS */}
                {activeTab === 'filters' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {FILTERS.map(f => (
                      <div
                        key={f.id}
                        onClick={() => setSelectedFilter(f.id)}
                        style={{
                          borderRadius: '14px', cursor: 'pointer', overflow: 'hidden', transition: 'all 0.2s',
                          border: selectedFilter === f.id ? '2px solid #8B5CF6' : '2px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {/* Visual preview swatch */}
                        <div style={{ height: '52px', background: f.preview.replace('bg-gradient-to-br ', ''), position: 'relative' }}
                          className={f.preview}>
                          {selectedFilter === f.id && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(139,92,246,0.3)' }}>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                          )}
                        </div>
                        <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)' }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: selectedFilter === f.id ? '#C4B5FD' : '#A1A1AA' }}>{f.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* FONTS */}
                {activeTab === 'fonts' && FONTS.map(f => (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFont(f.id)}
                    style={{
                      padding: '16px', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s',
                      background: selectedFont === f.id ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                      border: selectedFont === f.id ? '1px solid rgba(139,92,246,0.6)' : '1px solid rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', gap: '14px',
                    }}
                  >
                    {/* Font preview */}
                    <div style={{ width: '44px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: f.family, fontWeight: f.weight, fontSize: '16px', color: selectedFont === f.id ? '#C4B5FD' : '#fff' }}>Aa</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', marginBottom: '3px', fontFamily: f.family }}>{f.name}</div>
                      <div style={{ fontSize: '10px', color: '#71717A' }}>{f.desc}</div>
                    </div>
                    {selectedFont === f.id && (
                      <div style={{ marginLeft: 'auto', width: '18px', height: '18px', borderRadius: '50%', background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Export Footer */}
              <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                <div style={{ marginBottom: '12px', padding: '12px 14px', background: 'rgba(139,92,246,0.06)', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.12)' }}>
                  <div style={{ fontSize: '9px', fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.12em', marginBottom: '6px' }}>EXPORT SETTINGS</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                    <b style={{ color: '#C4B5FD' }}>{TEMPLATES.find(t => t.id === selectedTemplate)?.name}</b>
                    {' · '}<b style={{ color: '#C4B5FD' }}>{FILTERS.find(f => f.id === selectedFilter)?.name}</b>
                    {' · '}<b style={{ color: '#C4B5FD' }}>{FONTS.find(f => f.id === selectedFont)?.name}</b>
                  </div>
                </div>
                <button
                  onClick={() => startExport(selectedClip)}
                  className="shimmer-btn"
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}
                >
                  CONFIRM & EXPORT
                </button>
              </div>
            </div>

            {/* Center: Video Preview — properly centered for 13" screens */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050508', position: 'relative', overflow: 'hidden', padding: '24px' }}>

              {/* Ambient glow */}
              <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

              {/* Phone mockup — sized to fit 13" screen */}
              <div style={{
                width: 'min(260px, 38vh)',
                aspectRatio: '9/16',
                background: '#000',
                borderRadius: '32px',
                overflow: 'hidden',
                boxShadow: '0 0 80px rgba(139,92,246,0.12), 0 40px 80px rgba(0,0,0,0.6)',
                position: 'relative',
                border: '8px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
              }}>
                {/* Lens flare */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(to bottom, rgba(139,92,246,0.08), transparent)', zIndex: 5, pointerEvents: 'none' }} />

                {/* Video with filter applied */}
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?start=${parseTime(selectedClip.start)}&autoplay=1&controls=0&modestbranding=1&rel=0&mute=0`}
                  style={{
                    width: '100%', height: '100%', border: 'none',
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%) scale(1.6)',
                    filter: FILTERS.find(f => f.id === selectedFilter)?.css || 'none',
                  }}
                  allow="autoplay; encrypted-media"
                />

                {/* Live caption overlay */}
                <div style={{ position: 'absolute', bottom: '12%', left: 0, right: 0, padding: '0 16px', textAlign: 'center', zIndex: 10 }}>
                  <div style={{
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(12px)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    color: TEMPLATES.find(t => t.id === selectedTemplate)?.color || '#fff',
                    fontSize: '13px',
                    fontWeight: FONTS.find(f => f.id === selectedFont)?.weight || 900,
                    fontStyle: TEMPLATES.find(t => t.id === selectedTemplate)?.fontStyle || 'normal',
                    fontFamily: FONTS.find(f => f.id === selectedFont)?.family || 'inherit',
                    textShadow: TEMPLATES.find(t => t.id === selectedTemplate)?.textShadow || 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    lineHeight: 1.3,
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    {selectedClip.suggested_captions?.[0] || selectedClip.main_quote || 'Caption Preview'}
                  </div>
                </div>

                {/* Notch */}
                <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', width: '60px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', zIndex: 20 }} />
              </div>

              {/* Format badges below phone */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                {['9:16 Vertical', '1080p', 'MP4'].map(label => (
                  <div key={label} style={{ padding: '5px 12px', borderRadius: '99px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '9px', fontWeight: 800, color: '#71717A', letterSpacing: '0.1em' }}>
                    {label}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
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
