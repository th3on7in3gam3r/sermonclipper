'use client';
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useSearchParams } from 'next/navigation';
import React, { useState, useEffect, Suspense } from 'react';
import { useAuth, SignInButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import toast from 'react-hot-toast';
import VesperTour from '@/components/VesperTour';
// Google Fonts loaded via <link> in layout — preloaded here for instant availability
const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Playfair+Display:wght@700;900&display=swap';

function ResultsContent() {
  // Inject Google Fonts once on mount so Outfit & Playfair Display render correctly
  useEffect(() => {
    if (document.getElementById('vesper-gfonts')) return;
    const link = document.createElement('link');
    link.id = 'vesper-gfonts';
    link.rel = 'stylesheet';
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
  }, []);
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get('videoUrl');
  const jobId = searchParams.get('jobId');
  const [analysis, setAnalysis] = useState<any>(null);
  const [rendering, setRendering] = useState<{ [key: number]: { status: string, url?: string } }>({});
  const [userStatus, setUserStatus] = useState<any>(null);
  const { isLoaded, userId } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState('studio'); // 'studio', 'strategy', 'publish'

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  
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
    } catch {
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

  // If the source is YouTube (not a direct upload), Shotstack can't render from it
  const isYouTubeSource = !!videoId;

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

  // Caption dropdown state per clip
  const [openCaptionIdx, setOpenCaptionIdx] = useState<number | null>(null);

  // Render progress per clip (0-100)
  const [renderProgress, setRenderProgress] = useState<{ [key: number]: number }>({});

  // Timestamp scrubber state in Studio
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [previewStart, setPreviewStart] = useState(0);
  const [previewEnd, setPreviewEnd] = useState(0);

  // Caption animation style
  const [selectedAnimation, setSelectedAnimation] = useState('fade');

  const [showYTDesc, setShowYTDesc] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showQuoteVault, setShowQuoteVault] = useState(false);

  // Caption overrides — user edits per clip in Studio
  const [captionOverrides, setCaptionOverrides] = useState<{ [key: number]: string }>({});

  // Brand Kit — persisted in localStorage
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadBrandKit = () => {
    try {
      const saved = localStorage.getItem('vesper-brand-kit');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  };
  const saveBrandKit = (kit: { template: string; filter: string; font: string; animation: string }) => {
    localStorage.setItem('vesper-brand-kit', JSON.stringify(kit));
    toast.success('Brand kit saved as default! ✦');
  };



  // Core Asset State
  const [thumbnails, setThumbnails] = useState<{ [key: number]: { status: string; url?: string; variants?: string[] } }>({});
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const ANIMATIONS = [
    { id: 'fade', name: 'Fade', desc: 'Smooth dissolve in/out' },
    { id: 'slideUp', name: 'Slide Up', desc: 'Text rises from below' },
    { id: 'zoom', name: 'Zoom', desc: 'Scale in from center' },
    { id: 'carve', name: 'Carve', desc: 'Wipe reveal left to right' },
  ];

  // Thumbnail Studio state
  const [activeThumbnailClip, setActiveThumbnailClip] = useState<any>(null);
  const [thumbPrompt, setThumbPrompt] = useState('');
  const [thumbStyle, setThumbStyle] = useState('cinematic');
  const [isGeneratingThumb, setIsGeneratingThumb] = useState(false);

  const THUMB_STYLES = [
    { id: 'cinematic', name: 'Cinematic', icon: '🎬', prompt: 'cinematic lighting, dramatic shadows, epic atmosphere, professional photography' },
    { id: 'bold', name: 'Bold Impact', icon: '⚡', prompt: 'bright vibrant colors, high contrast, massive bold typography, energetic feel' },
    { id: 'minimal', name: 'Minimalist', icon: '⚪', prompt: 'clean white space, soft lighting, modern minimalist design, light and airy' }
  ];

  const handleGenerateThumbnail = async () => {
    if (!activeThumbnailClip) return;
    
    setIsGeneratingThumb(true);
    const i = activeThumbnailClip.index;
    setThumbnails(prev => ({ ...prev, [i]: { status: 'loading' } }));
    
    const baseText = `YouTube thumbnail, 16:9 aspect ratio, text overlay saying "${thumbPrompt || activeThumbnailClip.hook_title}", church/faith theme, professional quality, no watermarks`;
    
    const prompts = [
      `${baseText}, ${THUMB_STYLES[0].prompt}`,
      `${baseText}, ${THUMB_STYLES[1].prompt}`,
      `${baseText}, ${THUMB_STYLES[2].prompt}`
    ];
    
    try {
      const promises = prompts.map(p => fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p }),
      }).then(res => res.json()));

      const results = await Promise.allSettled(promises);
      const urls = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value.success)
        .map(r => r.value.imageUrl);
        
      if (urls.length > 0) {
        setThumbnails(prev => ({ ...prev, [i]: { status: 'done', url: urls[0], variants: urls } }));
        setSelectedVariantIdx(0);
        toast.success(`Generated ${urls.length} variants! ✦`);
      } else {
        setThumbnails(prev => ({ ...prev, [i]: { status: 'error' } }));
        toast.error('Thumbnail generation failed.');
      }
    } catch {
      setThumbnails(prev => ({ ...prev, [i]: { status: 'error' } }));
      toast.error('Network error.');
    } finally {
      setIsGeneratingThumb(false);
    }
  };

  const PLATFORMS = [
    { id: 'instagram', label: 'Instagram', icon: '📸', prefix: '✨ ', format: 'Feed / Reels', limit: 2200 },
    { id: 'tiktok', label: 'TikTok', icon: '🎵', prefix: '', format: 'Short-form Video', limit: 2200 },
    { id: 'youtube', label: 'YouTube Shorts', icon: '▶️', prefix: '', format: 'Shorts / Description', limit: 500 },
    { id: 'x', label: 'X / Twitter', icon: '🐦', prefix: '', format: 'Post', limit: 280 },
    { id: 'facebook', label: 'Facebook', icon: '📘', prefix: '', format: 'Post / Reel', limit: 63206 },
  ];

  const buildYouTubeDescription = () => {
    if (!analysis) return '';
    const lines: string[] = [];
    lines.push(analysis.sermon_title || 'Sermon');
    lines.push('');
    lines.push(analysis.summary || analysis.main_theme || '');
    lines.push('');
    lines.push('⏱ TIMESTAMPS');
    (analysis.clips || []).forEach((clip: any, i: number) => {
      const t = parseTime(clip.start);
      const mm = String(Math.floor(t / 60)).padStart(2, '0');
      const ss = String(t % 60).padStart(2, '0');
      lines.push(`${mm}:${ss} — ${clip.hook_title || `Clip ${i + 1}`}`);
    });
    lines.push('');
    lines.push('#sermon #church #faith #christianity #worship #bible #jesus #ministry #gospel #holyspirit');
    return lines.join('\n');
  };

  const handleYouTubeUpload = async (clip: any) => {
    const i = clip.index;
    const exportUrl = rendering[i]?.url;
    if (!exportUrl) return toast.error('Please render the reel first!');

    const loadToast = toast.loading('Preparing YouTube Harvest...');
    
    try {
      // 1. Check if connected, else redirect to auth
      const authRes = await fetch('/api/youtube/auth');
      const authData = await authRes.json();
      
      // If the backend says we need to authorize, redirect
      if (authData.url) {
        window.location.href = authData.url;
        return;
      }

      // 2. Upload
      const uploadRes = await fetch('/api/youtube/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: exportUrl,
          title: clip.hook_title || 'Sermon Highlight',
          description: buildYouTubeDescription()
        })
      });

      const uploadData = await uploadRes.json();
      if (uploadData.success) {
        toast.success('Successfully uploaded to YouTube Shorts! 🚀', { id: loadToast });
      } else {
        throw new Error(uploadData.error || 'Upload failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'YouTube integration requires setup.', { id: loadToast });
    }
  };


  const startExport = async (clip: any) => {
    // Guard: prevent export attempts when source is YouTube (no direct MP4)
    if (isYouTubeSource) {
      toast.error('Export requires a direct MP4 upload. YouTube streaming cannot be rendered.');
      return;
    }

    const index = clip.index;
    setRendering(prev => ({ ...prev, [index]: { status: 'loading' } }));
    setRenderProgress(prev => ({ ...prev, [index]: 0 }));
    const renderToastId = toast.loading('Synchronizing with Shotstack Cloud...');
    
    try {
      const res = await fetch('/api/render-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId, 
          clip: { 
            ...clip, 
            start: trimStart || clip.start, 
            end: trimEnd || clip.end,
            suggested_captions: captionOverrides[index] ? [captionOverrides[index]] : clip.suggested_captions
          },
          index,
          template: selectedTemplate,
          filter: selectedFilter,
          font: selectedFont,
          animation: selectedAnimation,
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
    } catch {
      setRendering(prev => ({ ...prev, [index]: { status: 'error' } }));
      toast.error('Network error during rendering.', { id: renderToastId });
    }
  };

  const handleBatchExport = async () => {
    if (!analysis?.clips) return;
    toast.success('Batch export initiated! Firing up neural engines...', { icon: '🚀' });
    
    const clips = analysis.clips;
    for (let i = 0; i < clips.length; i += 3) {
      const batch = clips.slice(i, i + 3);
      await Promise.all(batch.map((clip: any, idx: number) => startExport({ ...clip, index: i + idx })));
      // Throttle slightly to respect cloud rendering bounds
      if (i + 3 < clips.length) await new Promise(r => setTimeout(r, 2000));
    }
  };

  const downloadQuoteGraphic = (clip: any, index: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient (Deep Space to Vesper Purple)
    const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
    grad.addColorStop(0, '#0A0A0F');
    grad.addColorStop(1, '#2c1954');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Decorative Quotation Mark
    ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
    ctx.font = '900 600px sans-serif';
    ctx.fillText('"', 80, 500);

    // Quote Text Wrapper
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const quote = `"${clip.main_quote}"`;
    const words = quote.split(' ');
    let line = '';
    let y = 440;
    const lines = [];

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 800 && i > 0) {
        lines.push(line);
        line = words[i] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    // Center text vertically
    const totalTextHeight = lines.length * 80;
    y = (1080 - totalTextHeight) / 2 + 40;

    lines.forEach(l => {
      ctx.fillText(l, 540, y);
      y += 80;
    });

    // Branding Footer
    ctx.fillStyle = '#8B5CF6';
    ctx.font = '900 28px sans-serif';
    ctx.fillText('VESPER', 540, 950);
    
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '400 24px sans-serif';
    ctx.fillText(analysis?.sermon_title || 'Sermon Highlight', 540, 990);

    // Trigger Download
    const link = document.createElement('a');
    link.download = `quote-vault-${index + 1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Quote Graphic Downloaded! 📸');
  };

  const pollStatus = async (id: string, index: number, toastId: string) => {
    try {
      const res = await fetch(`/api/render-status?id=${id}`);
      const data = await res.json();

      if (data.percent) {
        setRenderProgress(prev => ({ ...prev, [index]: Math.round(data.percent) }));
      }

      if (data.status === 'done') {
        setRendering(prev => ({ ...prev, [index]: { status: 'complete', url: data.url } }));
        setRenderProgress(prev => ({ ...prev, [index]: 100 }));
        toast.success('Reel successfully rendered!', { id: toastId });
        setSelectedClip(null);
      } else if (data.status === 'failed') {
        setRendering(prev => ({ ...prev, [index]: { status: 'error' } }));
        toast.error('Cloud render failed.', { id: toastId });
      } else {
        setTimeout(() => pollStatus(id, index, toastId), 3000);
      }
    } catch {
      setRendering(prev => ({ ...prev, [index]: { status: 'error' } }));
    }
  };

  const handleCustomize = (clip: any, index: number) => {
    const s = parseTime(clip.start);
    const e = parseTime(clip.end);
    setTrimStart(s);
    setTrimEnd(e);
    setPreviewStart(s);
    setPreviewEnd(e);
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

    const fetchUserStatus = async () => {
      try {
        const res = await fetch('/api/user/status');
        const data = await res.json();
        setUserStatus(data);
      } catch (e) {
        console.error('Failed to fetch user status:', e);
      }
    };

    fetchResults();
    fetchUserStatus();
    const interval = setInterval(fetchResults, 2000);

    return () => clearInterval(interval);
  }, [jobId, userId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Session link copied to clipboard!');
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Navigation — Fixed 64px height */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', zIndex: 1000, background: 'rgba(10, 10, 15, 0.95)', backdropFilter: 'blur(30px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: isMobile ? '11px' : '13px', fontWeight: 900, letterSpacing: '0.4em', color: '#fff' }}>VESPER</div>
        </Link>
        <div style={{ display: 'flex', gap: isMobile ? '12px' : '24px', alignItems: 'center' }}>
          {isLoaded && userId ? (
            <>
              {!isMobile && <Link href="/" style={{ textDecoration: 'none', fontSize: '11px', fontWeight: 800, color: '#A1A1AA', letterSpacing: '0.1em' }}>HOME</Link>}
              {!isMobile && <Link href="/dashboard" style={{ textDecoration: 'none', fontSize: '11px', fontWeight: 800, color: '#A1A1AA', letterSpacing: '0.1em' }}>ARCHIVE</Link>}
              <button
                onClick={() => setShowTour(true)}
                title="Open tutorial"
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)',
                  color: '#8B5CF6', fontSize: '14px', fontWeight: 900,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                }}
              >?</button>
              <UserButton />
            </>
          ) : (
            <SignInButton mode="modal">
              <button className="shimmer-btn" style={{ padding: '10px 24px', fontSize: '11px' }}>SIGN IN</button>
            </SignInButton>
          )}
        </div>
      </header>

      {/* Main Content Wrapper with PaddingTop to clear fixed header */}
      <div style={{ paddingTop: '64px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '0 16px' : '0 32px' }}>

          {/* Hero Metadata Section — 32px MarginTop */}
          <div className="glass-panel" style={{ padding: '40px', marginTop: '32px', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>

        {/* YouTube source banner */}
        {isYouTubeSource && (
          <div style={{ marginBottom: '24px', padding: '14px 20px', background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 2 }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>📺</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', color: '#FB923C', fontWeight: 800, marginBottom: '2px' }}>YOUTUBE SOURCE — PREVIEW MODE</p>
              <p style={{ fontSize: '10px', color: '#A1A1AA', lineHeight: 1.5 }}>AI analysis is complete. To export reels via Shotstack, download the sermon MP4 from YouTube and re-upload it directly.</p>
            </div>
            <Link href="/" style={{ flexShrink: 0, padding: '8px 16px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#34D399', fontSize: '10px', fontWeight: 800, textDecoration: 'none', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
              UPLOAD MP4
            </Link>
          </div>
        )}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '99px', marginBottom: '16px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8B5CF6', boxShadow: '0 0 6px #8B5CF6' }} />
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.2em' }}>MEDIA KIT READY</span>
              </div>
              <h1 style={{ fontSize: isMobile ? '32px' : 'clamp(28px, 4vw, 52px)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '12px' }}>
                {analysis?.sermon_title || 'PROCESSING...'}{' '}
                <span style={{ color: '#8B5CF6' }}>RESULTS</span>
              </h1>
              <p style={{ color: '#A1A1AA', fontSize: isMobile ? '14px' : '15px', maxWidth: '560px', lineHeight: 1.6 }}>
                {analysis?.main_theme || 'Harvesting deep insights from your sermon session...'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: isMobile ? '100%' : '200px', width: isMobile ? '100%' : 'auto' }}>
              <button onClick={handleBatchExport} className="shimmer-btn" style={{ width: '100%', padding: '14px', fontSize: '11px', background: 'linear-gradient(90deg, #10B981, #059669)' }}>BATCH EXPORT ALL</button>
              <button onClick={handleCopy} className="glass-panel" style={{ width: '100%', padding: '14px', fontSize: '11px', border: '1px solid rgba(255,255,255,0.1)' }}>COPY SESSION LINK</button>
              <a href={videoUrl || '#'} download className="glass-panel" style={{ width: '100%', padding: '14px', textAlign: 'center', textDecoration: 'none', color: '#fff', fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', display: 'block' }}>DOWNLOAD MASTER</a>
            </div>
          </div>
        </div>
      </div>

       <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px', marginTop: '0' }}>
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
              <video src={videoUrl} controls preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                    src={videoUrl}
                    controls
                    preload="metadata"
                    onLoadedMetadata={(e) => {
                      const vid = e.currentTarget;
                      const start = parseTime(clip.start);
                      vid.currentTime = start;
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 16px', borderRadius: '99px', fontSize: '10px', fontWeight: 900, letterSpacing: '0.1em', backdropFilter: 'blur(10px)' }}>NEURAL CLIP {i+1}</div>
                {/* Duration badge */}
                <div style={{ position: 'absolute', bottom: '12px', left: '20px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '3px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 800, backdropFilter: 'blur(10px)', fontFamily: 'monospace' }}>
                  {Math.floor((parseTime(clip.end) - parseTime(clip.start)) / 60)}:{String((parseTime(clip.end) - parseTime(clip.start)) % 60).padStart(2, '0')}
                </div>
                {clip.viral_score && (
                  <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(139, 92, 246, 0.9)', color: '#fff', padding: '4px 12px', borderRadius: '99px', fontSize: '10px', fontWeight: 900, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px' }}>🔥</span> {clip.viral_score}% VIRAL
                  </div>
                )}
              </div>
              <div className="clip-info">
                <h4 style={{ color: '#8B5CF6', fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>{clip.hook_title}</h4>
                <p style={{ fontStyle: 'italic', color: '#fff', fontSize: '15px', lineHeight: 1.5 }}>&ldquo;{clip.main_quote}&rdquo;</p>
              </div>
              <div style={{ padding: '0 24px 24px' }}>

                {/* Caption Dropdown */}
                <div style={{ marginBottom: '12px', position: 'relative' }}>
                  <button
                    onClick={() => setOpenCaptionIdx(openCaptionIdx === i ? null : i)}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#A1A1AA', fontSize: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', letterSpacing: '0.08em' }}
                  >
                    <span>COPY CAPTION</span>
                    <span style={{ opacity: 0.5 }}>{openCaptionIdx === i ? '▲' : '▼'}</span>
                  </button>
                  {openCaptionIdx === i && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#111114', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', marginTop: '4px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
                      {PLATFORMS.map((p, pi) => {
                        const caption = clip.suggested_captions?.[pi] || clip.suggested_captions?.[0] || clip.main_quote || '';
                        const text = `${p.prefix}${caption}`;
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              navigator.clipboard.writeText(text);
                              toast.success(`${p.label} caption copied!`);
                              setOpenCaptionIdx(null);
                            }}
                            style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', borderBottom: pi < PLATFORMS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}
                          >
                            <span style={{ fontSize: '14px' }}>{p.icon}</span>
                            <div>
                              <div style={{ fontSize: '10px', color: '#8B5CF6', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '2px' }}>{p.label}</div>
                              <div style={{ color: '#A1A1AA', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{text.slice(0, 60)}…</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Thumbnail Preview / Studio Trigger */}
                {thumbnails[i]?.status === 'done' && thumbnails[i]?.url ? (
                  <div 
                    onClick={() => { setActiveThumbnailClip({ ...clip, index: i }); setThumbPrompt(clip.hook_title); }}
                    style={{ cursor: 'pointer', marginBottom: '12px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <img 
                      src={`/api/proxy-image?url=${encodeURIComponent(thumbnails[i]?.url || '')}`} 
                      alt="Neural Thumbnail" 
                      loading="lazy"
                      style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} 
                    />
                  </div>
                ) : thumbnails[i]?.status === 'error' ? (
                  <button
                    onClick={() => { setActiveThumbnailClip({ ...clip, index: i }); setThumbPrompt(clip.hook_title); }}
                    style={{ width: '100%', marginBottom: '12px', padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#EF4444', fontSize: '10px', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.08em' }}
                  >
                    ⚠ THUMBNAIL FAILED — RETRY
                  </button>
                ) : (
                  <button
                    onClick={() => { setActiveThumbnailClip({ ...clip, index: i }); setThumbPrompt(clip.hook_title); }}
                    style={{ width: '100%', marginBottom: '12px', padding: '10px', background: 'rgba(244,185,66,0.05)', border: '1px solid rgba(244,185,66,0.15)', borderRadius: '10px', color: '#F4B942', fontSize: '10px', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.08em' }}
                  >
                    🖼 OPEN THUMBNAIL STUDIO
                  </button>
                )}

                {/* Render progress bar */}
                {rendering[i]?.status === 'loading' && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.1em' }}>RENDERING</span>
                      <span style={{ fontSize: '9px', fontWeight: 900, color: '#8B5CF6' }}>{renderProgress[i] || 0}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${renderProgress[i] || 0}%`, background: 'linear-gradient(90deg, #8B5CF6, #D8B4FE)', borderRadius: '99px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )}

                {/* Main action button */}
                {rendering[i]?.status === 'loading' ? (
                  <button className="shimmer-btn" style={{ width: '100%', opacity: 0.7, cursor: 'wait', padding: '14px' }} disabled>
                    RENDERING...
                  </button>
                ) : rendering[i]?.status === 'complete' ? (
                  <a href={rendering[i].url} download target="_blank" className="shimmer-btn" style={{ display: 'block', width: '100%', textAlign: 'center', background: 'linear-gradient(90deg, #10B981, #34D399)', textDecoration: 'none', padding: '14px' }}>
                    DOWNLOAD REEL
                  </a>
                ) : rendering[i]?.status === 'error' ? (
                  <button onClick={() => startExport({ ...clip, index: i })} className="shimmer-btn" style={{ width: '100%', padding: '14px', background: 'linear-gradient(90deg, #EF4444, #B91C1C)', animation: 'none' }}>
                    ⚠ RENDER FAILED — RETRY
                  </button>
                ) : isYouTubeSource ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ padding: '12px 16px', background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
                      <div>
                        <p style={{ fontSize: '11px', color: '#FB923C', fontWeight: 800, marginBottom: '4px' }}>YOUTUBE SOURCE DETECTED</p>
                        <p style={{ fontSize: '10px', color: '#A1A1AA', lineHeight: 1.5 }}>Reel export requires a direct MP4 file. Download this sermon from YouTube and re-upload it to enable full Studio rendering.</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleCustomize(clip, i)} style={{ flex: 1, padding: '12px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', color: '#A78BFA', fontSize: '10px', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.08em' }}>
                        PREVIEW STUDIO
                      </button>
                      <Link href="/" style={{ flex: 1, padding: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#34D399', fontSize: '10px', fontWeight: 800, textDecoration: 'none', textAlign: 'center', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        RE-UPLOAD MP4
                      </Link>
                    </div>
                  </div>
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
            title="YouTube Description" 
            desc="Auto-assembled description with timestamps, summary, and hashtags — ready to paste." 
            onClick={() => setShowYTDesc(true)}
          />
          <ToolCard 
            title="Quote Vault" 
            desc="A collection of the most impactful quotes for daily sharing." 
            onClick={() => setShowQuoteVault(true)}
          />
        </div>
      </div>

      {/* PWA / Link Footer */}
      <footer style={{ padding: '60px 0', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', fontSize: '10px', fontWeight: 900, letterSpacing: '0.2em', opacity: 0.4, marginBottom: '16px' }}>
          <Link href="/privacy" style={{ color: '#fff', textDecoration: 'none' }}>PRIVACY</Link>
          <Link href="/terms" style={{ color: '#fff', textDecoration: 'none' }}>TERMS</Link>
          <span style={{ color: '#fff' }}>© 2026 VESPER</span>
        </div>
        <p style={{ fontSize: '11px', color: '#52525B', fontWeight: 600 }}>
          Made by <a href="https://biblefunland.com" target="_blank" rel="noreferrer" style={{ color: '#8B5CF6', textDecoration: 'none', fontWeight: 800 }}>BIBLEFUNLAND</a> STUDIOS
        </p>
      </footer>

      {showCarouselModal && carouselData && (
        <CarouselModal data={carouselData} onClose={() => setShowCarouselModal(false)} />
      )}

      {/* YouTube Description Modal */}
      {showYTDesc && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '0' : '20px' }}>
          <div className="glass-panel animate-up" style={{ width: '100%', maxWidth: isMobile ? '100%' : '680px', height: isMobile ? '100%' : 'auto', maxHeight: isMobile ? '100%' : '85vh', borderRadius: isMobile ? '0' : '32px', display: 'flex', flexDirection: 'column', border: isMobile ? 'none' : '1px solid rgba(139,92,246,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.2em', marginBottom: '6px' }}>EXPORT TOOL</div>
                <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em' }}>YouTube Description</h2>
              </div>
              <button onClick={() => setShowYTDesc(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
              <pre style={{ fontFamily: 'inherit', fontSize: '14px', color: '#D4D4D8', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {buildYouTubeDescription()}
              </pre>
            </div>
            <div style={{ padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(buildYouTubeDescription());
                  toast.success('YouTube description copied!');
                }}
                className="shimmer-btn"
                style={{ width: '100%', padding: '16px', fontSize: '12px' }}
              >
                COPY TO CLIPBOARD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Vault Modal */}
      {showQuoteVault && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '0' : '20px' }}>
          <div className="glass-panel animate-up" style={{ width: '100%', maxWidth: isMobile ? '100%' : '800px', height: isMobile ? '100%' : 'auto', maxHeight: isMobile ? '100%' : '85vh', borderRadius: isMobile ? '0' : '32px', display: 'flex', flexDirection: 'column', border: isMobile ? 'none' : '1px solid rgba(139,92,246,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.2em', marginBottom: '6px' }}>EXPAND YOUR MINISTRY</div>
                <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em' }}>Quote Vault</h2>
                <p style={{ color: '#A1A1AA', fontSize: '14px', marginTop: '4px' }}>Auto-generated 1080x1080 graphics for Instagram Stories.</p>
              </div>
              <button onClick={() => setShowQuoteVault(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {analysis?.clips?.map((clip: any, i: number) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '10px', fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.1em', marginBottom: '12px' }}>CLIP {i + 1}</div>
                  <div style={{ flex: 1, marginBottom: '20px' }}>
                    <p style={{ fontStyle: 'italic', fontSize: '16px', lineHeight: 1.5, color: '#E4E4E7' }}>&ldquo;{clip.main_quote}&rdquo;</p>
                  </div>
                  <button
                    onClick={() => downloadQuoteGraphic(clip, i)}
                    className="shimmer-btn"
                    style={{ padding: '12px', fontSize: '11px', width: '100%' }}
                  >
                    DOWNLOAD GRAPHIC
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vesper Studio Overlay — Professional 3-Panel Suite */}
      {selectedClip && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#050508', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}>

          {/* Top Bar — Global Controls */}
          <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(10,10,15,0.98)', borderBottom: '1px solid rgba(255,255,255,0.06)', zIndex: 50 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8B5CF6', boxShadow: '0 0 12px #8B5CF6' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.4em', color: '#fff' }}>VESPER STUDIO</span>
                <span style={{ fontSize: '9px', color: '#52525B', letterSpacing: '0.1em' }}>Neural Editing Phase — 9:16 Vertical</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedClip(null)}
              style={{ padding: '8px 20px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', transition: 'all 0.2s' }}
            >✕ CLOSE STUDIO</button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>
            <div style={{ 
              width: isMobile ? '100%' : '280px', 
              flexShrink: 0, 
              background: '#0A0A0F', 
              borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)', 
              borderBottom: isMobile ? '1px solid rgba(255,255,255,0.05)' : 'none',
              display: isMobile ? (mobileTab === 'studio' ? 'flex' : 'none') : 'flex', 
              flexDirection: 'column',
              overflow: 'hidden',
            }}>

              {/* Tabs Header — Icon Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                {[
                  { id: 'templates', icon: '◈', label: 'Style' },
                  { id: 'filters', icon: '◐', label: 'Filter' },
                  { id: 'fonts', icon: 'Aa', label: 'Font' },
                  { id: 'motion', icon: '▷', label: 'Motion' },
                  { id: 'trim', icon: '✂', label: 'Trim' },
                  { id: 'publish', icon: '↗', label: 'Publish' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '12px 4px',
                      background: activeTab === tab.id ? 'rgba(139,92,246,0.08)' : 'transparent',
                      border: 'none',
                      borderBottom: activeTab === tab.id ? '2px solid #8B5CF6' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                    }}
                  >
                    <span style={{ fontSize: '14px', color: activeTab === tab.id ? '#A78BFA' : '#52525B', lineHeight: 1 }}>{tab.icon}</span>
                    <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.05em', color: activeTab === tab.id ? '#A78BFA' : '#3F3F46' }}>{tab.label}</span>
                  </button>
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

                {/* MOTION */}
                {activeTab === 'motion' && (
                  <>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '9px', fontWeight: 900, color: '#52525B', letterSpacing: '0.15em', marginBottom: '12px' }}>CAPTION ANIMATION</div>
                      {ANIMATIONS.map(a => (
                        <div
                          key={a.id}
                          onClick={() => setSelectedAnimation(a.id)}
                          style={{
                            padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '8px',
                            background: selectedAnimation === a.id ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                            border: selectedAnimation === a.id ? '1px solid rgba(139,92,246,0.6)' : '1px solid rgba(255,255,255,0.06)',
                            display: 'flex', alignItems: 'center', gap: '12px',
                          }}
                        >
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                            {a.id === 'fade' ? '✦' : a.id === 'slideUp' ? '↑' : a.id === 'zoom' ? '⊕' : '▶'}
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>{a.name}</div>
                            <div style={{ fontSize: '10px', color: '#71717A' }}>{a.desc}</div>
                          </div>
                          {selectedAnimation === a.id && (
                            <div style={{ marginLeft: 'auto', width: '18px', height: '18px', borderRadius: '50%', background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* TRIM TAB */}
                {activeTab === 'trim' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ padding: '20px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                      <div style={{ fontSize: '10px', fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.15em', marginBottom: '16px' }}>PRECISION TRIMMER</div>
                      
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>IN POINT</span>
                          <span style={{ fontSize: '12px', color: '#8B5CF6', fontWeight: 900, fontFamily: 'monospace' }}>{Math.floor(trimStart/60)}:{String(trimStart%60).padStart(2,'0')}</span>
                        </div>
                        <input
                          type="range"
                          min={Math.max(0, parseTime(selectedClip.start) - 60)}
                          max={trimEnd - 1}
                          value={trimStart}
                          onChange={e => setTrimStart(Number(e.target.value))}
                          onMouseUp={() => { setPreviewStart(trimStart); setPreviewEnd(trimEnd); }}
                          style={{ width: '100%', accentColor: '#8B5CF6', height: '6px' }}
                        />
                      </div>

                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>OUT POINT</span>
                          <span style={{ fontSize: '12px', color: '#8B5CF6', fontWeight: 900, fontFamily: 'monospace' }}>{Math.floor(trimEnd/60)}:{String(trimEnd%60).padStart(2,'0')}</span>
                        </div>
                        <input
                          type="range"
                          min={trimStart + 1}
                          max={parseTime(selectedClip.end) + 60}
                          value={trimEnd}
                          onChange={e => setTrimEnd(Number(e.target.value))}
                          onMouseUp={() => { setPreviewStart(trimStart); setPreviewEnd(trimEnd); }}
                          style={{ width: '100%', accentColor: '#8B5CF6', height: '6px' }}
                        />
                      </div>

                      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#71717A', fontWeight: 700 }}>FINAL DURATION</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', color: '#fff', fontWeight: 900 }}>{trimEnd - trimStart}s</span>
                          <span style={{ fontSize: '10px', color: trimEnd - trimStart > 60 ? '#EF4444' : '#22C55E' }}>
                            {trimEnd - trimStart > 60 ? '⚠️ Too long for Shorts' : '✓ Perfect for Reels'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: '11px', color: '#52525B', lineHeight: 1.6, padding: '0 10px' }}>
                      Tip: Use the sliders to adjust the exact moment the clip starts and ends. The preview will automatically loop between these two points.
                    </p>
                  </div>
                )}

                {/* PUBLISH TAB */}
                {activeTab === 'publish' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                      <div style={{ fontSize: '40px', marginBottom: '16px' }}>▶️</div>
                      <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>Push to YouTube</h3>
                      <p style={{ fontSize: '12px', color: '#A1A1AA', marginBottom: '24px', lineHeight: 1.5 }}>
                        Instantly upload this cinematic clip as a YouTube Short to your ministry channel.
                      </p>
                      
                      {rendering[selectedClip.index]?.status === 'complete' ? (
                        <button 
                          onClick={() => handleYouTubeUpload(selectedClip)}
                          className="shimmer-btn"
                          style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}
                        >
                          {userStatus?.youtubeConnected ? 'DIRECT UPLOAD TO YOUTUBE' : 'CONNECT YOUTUBE CHANNEL'}
                        </button>
                      ) : (
                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', fontSize: '10px', color: '#71717A', fontWeight: 700 }}>
                          RENDER REEL FIRST TO UNLOCK UPLOAD
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                      <div style={{ fontSize: '40px', marginBottom: '16px' }}>📸</div>
                      <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>Instagram / TikTok</h3>
                      <p style={{ fontSize: '12px', color: '#A1A1AA', marginBottom: '24px', lineHeight: 1.5 }}>
                        Download the reel and use the generated captions to post on social platforms.
                      </p>
                      <button 
                        onClick={() => window.open(rendering[selectedClip.index]?.url)}
                        disabled={rendering[selectedClip.index]?.status !== 'complete'}
                        style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '12px', fontWeight: 800, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}
                      >
                        DOWNLOAD ASSET
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Export Footer */}
              <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                <div style={{ marginBottom: '12px', padding: '12px 14px', background: 'rgba(139,92,246,0.06)', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.12)' }}>
                  <div style={{ fontSize: '9px', fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.12em', marginBottom: '6px' }}>EXPORT SETTINGS</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                    <b style={{ color: '#C4B5FD' }}>{TEMPLATES.find(t => t.id === selectedTemplate)?.name}</b>
                    {' · '}<b style={{ color: '#C4B5FD' }}>{FILTERS.find(f => f.id === selectedFilter)?.name}</b>
                    {' · '}<b style={{ color: '#C4B5FD' }}>{FONTS.find(f => f.id === selectedFont)?.name}</b>
                    {' · '}<b style={{ color: '#C4B5FD' }}>{ANIMATIONS.find(a => a.id === selectedAnimation)?.name}</b>
                    {' · '}<b style={{ color: '#C4B5FD' }}>{trimEnd - trimStart}s</b>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => saveBrandKit({ template: selectedTemplate, filter: selectedFilter, font: selectedFont, animation: selectedAnimation })}
                    style={{ width: '48px', flexShrink: 0, padding: '16px 0', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#A1A1AA', cursor: 'pointer', fontSize: '14px' }}
                    title="Save as Default Brand Kit"
                  >
                    💾
                  </button>
                  <button
                    onClick={() => { setSelectedTemplate('minimal'); setSelectedFilter('none'); setSelectedFont('outfit'); setSelectedAnimation('fade'); if (selectedClip) { setTrimStart(parseTime(selectedClip.start)); setTrimEnd(parseTime(selectedClip.end)); } toast.success('Reset to defaults'); }}
                    style={{ width: '48px', flexShrink: 0, padding: '16px 0', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#A1A1AA', cursor: 'pointer', fontSize: '14px' }}
                    title="Reset to Defaults"
                  >
                    ↺
                  </button>
                  <button
                    onClick={() => startExport(selectedClip)}
                    className="shimmer-btn"
                    style={{ flex: 1, padding: '16px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}
                  >
                    CONFIRM & EXPORT
                  </button>
                </div>
              </div>
            </div>

            {/* PANEL 2: CENTER (Cinematic Preview) */}
            <div style={{ 
              flex: 1, 
              position: 'relative', 
              background: '#050508', 
              display: (isMobile && mobileTab !== 'studio') ? 'none' : 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: isMobile ? '20px' : '40px',
              minHeight: isMobile ? '60vh' : 'auto'
            }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />
              
              {/* Phone Mockup Wrapper */}
              <div style={{ 
                width: 'min(320px, 45vh)', 
                aspectRatio: '9/16', 
                background: '#000', 
                borderRadius: '40px', 
                border: '8px solid #18181B', 
                boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
                position: 'relative',
                overflow: 'hidden',
                zIndex: 10
              }}>
                {videoId ? (
                  <iframe
                    style={{ width: '100%', height: '100%', border: 'none', filter: FILTERS.find(f => f.id === selectedFilter)?.css || 'none' }}
                    src={`https://www.youtube.com/embed/${videoId}?start=${previewStart}&end=${previewEnd}&autoplay=0&mute=0&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0`}
                    allow="autoplay; encrypted-media"
                  />
                ) : videoUrl && (
                  <video 
                    src={`${videoUrl}#t=${previewStart},${previewEnd}`}
                    controls loop playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: FILTERS.find(f => f.id === selectedFilter)?.css || 'none' }}
                  />
                )}

                {/* Caption Overlay Preview */}
                <div style={{ position: 'absolute', bottom: '25%', left: '10%', right: '10%', zIndex: 20 }}>
                  <div
                    key={selectedAnimation}
                    style={{
                      textAlign: 'center',
                      color: TEMPLATES.find(t => t.id === selectedTemplate)?.color || '#fff',
                      fontFamily: FONTS.find(f => f.id === selectedFont)?.family || 'inherit',
                      fontWeight: FONTS.find(f => f.id === selectedFont)?.weight || 900,
                      fontSize: '18px',
                      textShadow: TEMPLATES.find(t => t.id === selectedTemplate)?.textShadow || 'none',
                      fontStyle: TEMPLATES.find(t => t.id === selectedTemplate)?.fontStyle || 'normal',
                      textTransform: 'uppercase',
                      lineHeight: 1.2,
                      animation: `vesper-${selectedAnimation} 2.5s ease-in-out infinite`,
                    }}
                  >
                    {selectedClip.suggested_captions?.[0] || selectedClip.main_quote}
                  </div>
                </div>
              </div>

              {/* Caption Edit — below phone */}
              <div style={{ width: '100%', maxWidth: 'min(320px, 45vh)', marginTop: '16px' }}>
                <div style={{ fontSize: '9px', fontWeight: 900, color: '#52525B', letterSpacing: '0.15em', marginBottom: '8px', textAlign: 'center' }}>EDIT CAPTION</div>
                <textarea
                  value={captionOverrides[selectedClip?.index] ?? (selectedClip?.suggested_captions?.[0] || selectedClip?.main_quote || '')}
                  onChange={e => setCaptionOverrides(prev => ({ ...prev, [selectedClip.index]: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                    padding: '12px 14px', color: '#fff', fontSize: '12px',
                    lineHeight: 1.5, resize: 'none', fontFamily: 'inherit',
                    outline: 'none',
                  }}
                  placeholder="Edit caption before exporting..."
                />
              </div>
              
              {/* Format badges below phone */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                {['9:16 Vertical', '1080p', 'MP4'].map(label => (
                  <div key={label} style={{ padding: '5px 12px', borderRadius: '99px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '9px', fontWeight: 800, color: '#71717A', letterSpacing: '0.1em' }}>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* PANEL 3: RIGHT SIDEBAR — Social Kit & Export */}
            <div style={{ 
              width: isMobile ? '100%' : '320px', 
              flexShrink: 0, 
              background: '#0A0A0F', 
              borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)', 
              display: isMobile ? (mobileTab === 'strategy' ? 'flex' : 'none') : 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden' 
            }}>

              {/* Clip Metadata Strip */}
              <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 900, lineHeight: 1.3, color: '#fff', margin: 0 }}>{selectedClip.hook_title}</h3>
                  <div style={{ fontSize: '11px', fontWeight: 900, fontFamily: 'monospace', color: '#C4B5FD', flexShrink: 0 }}>{Math.floor(trimStart/60)}:{String(trimStart%60).padStart(2,'0')} · {trimEnd - trimStart}s</div>
                </div>
              </div>

              {/* Scrollable content: Social Kit + Engagement */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {selectedClip.engagement_hook && (
                  <div style={{ padding: '12px', background: 'rgba(139,92,246,0.06)', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <div style={{ fontSize: '8px', fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.15em', marginBottom: '4px' }}>ENGAGEMENT HOOK</div>
                    <p style={{ fontSize: '11px', color: '#A78BFA', lineHeight: 1.4, margin: 0 }}>&ldquo;{selectedClip.engagement_hook}&rdquo;</p>
                  </div>
                )}

                <div style={{ fontSize: '8px', fontWeight: 900, color: '#3F3F46', letterSpacing: '0.2em', padding: '8px 0 4px' }}>SOCIAL KIT — TAP TO COPY</div>
                {PLATFORMS.map((p, pi) => {
                  const caption = selectedClip.suggested_captions?.[pi] || selectedClip.suggested_captions?.[0] || selectedClip.main_quote || '';
                  const fullText = `${p.prefix}${caption}`;
                  const charCount = fullText.length;
                  const overLimit = p.limit ? charCount > p.limit : false;
                  return (
                    <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
                      {/* Platform header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '18px' }}>{p.icon}</span>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 900, color: '#fff' }}>{p.label}</div>
                            <div style={{ fontSize: '9px', color: '#52525B' }}>{p.format}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: overLimit ? '#F87171' : '#52525B', fontFamily: 'monospace' }}>
                          {charCount}{p.limit ? `/${p.limit}` : ''}
                        </div>
                      </div>
                      {/* Caption preview */}
                      <div style={{ padding: '10px 14px', fontSize: '12px', color: '#E4E4E7', lineHeight: 1.5 }}>
                        {fullText || <span style={{ color: '#3F3F46', fontStyle: 'italic' }}>No caption available</span>}
                      </div>
                      {/* Copy button */}
                      <div style={{ padding: '8px 14px 12px' }}>
                        <button
                          onClick={() => { navigator.clipboard.writeText(fullText); toast.success(`${p.label} caption copied!`); }}
                          style={{ width: '100%', padding: '8px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: '#C4B5FD', fontSize: '10px', fontWeight: 900, cursor: 'pointer', letterSpacing: '0.08em', transition: 'all 0.2s' }}
                        >
                          COPY TO CLIPBOARD
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Export Footer */}
              <div style={{ padding: '16px 20px 20px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ padding: '10px 12px', background: 'rgba(139,92,246,0.06)', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.12)', marginBottom: '12px' }}>
                  <div style={{ fontSize: '8px', fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.12em', marginBottom: '4px' }}>ACTIVE PROFILE</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                    <b style={{ color: '#C4B5FD' }}>{TEMPLATES.find(t => t.id === selectedTemplate)?.name}</b>
                    {' · '}<b style={{ color: '#C4B5FD' }}>{FILTERS.find(f => f.id === selectedFilter)?.name}</b>
                    {' · '}<b style={{ color: '#C4B5FD' }}>{FONTS.find(f => f.id === selectedFont)?.name}</b>
                  </div>
                </div>
                {isYouTubeSource ? (
                  <div style={{ padding: '12px', background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '10px', color: '#FB923C', fontWeight: 800, marginBottom: '4px' }}>EXPORT UNAVAILABLE</p>
                    <p style={{ fontSize: '9px', color: '#A1A1AA', lineHeight: 1.4 }}>Upload the MP4 directly to enable cloud rendering.</p>
                  </div>
                ) : (
                  <button onClick={() => startExport(selectedClip)} className="shimmer-btn" style={{ width: '100%', padding: '16px', fontSize: '12px' }}>
                    CONFIRM & EXPORT
                  </button>
                )}
              </div>
            </div>
          </div>

            {/* Mobile Bottom Tab Bar */}
            {isMobile && (
              <div style={{ position: 'sticky', bottom: 0, left: 0, right: 0, height: '72px', background: '#0A0A0F', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', zIndex: 100, backdropFilter: 'blur(20px)', flexShrink: 0 }}>
                {[
                  { id: 'studio', label: 'STUDIO', icon: '🎨' },
                  { id: 'strategy', label: 'STRATEGY', icon: '📈' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setMobileTab(tab.id)}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      background: 'none', border: 'none', color: mobileTab === tab.id ? '#8B5CF6' : '#52525B',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                    <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.1em' }}>{tab.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      
      {/* Thumbnail Studio Drawer — Side Slide-in */}
      {activeThumbnailClip && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 20000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 0.3s ease' }}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              width: 'min(800px, 90vw)', 
              height: '100%', 
              background: '#0A0A0F', 
              borderLeft: '1px solid rgba(255,255,255,0.06)', 
              display: 'flex', 
              flexDirection: 'column',
              animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '-40px 0 100px rgba(0,0,0,0.8)'
            }}
          >
            {/* Header */}
            <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 900, color: '#F4B942', letterSpacing: '0.2em', marginBottom: '4px' }}>NEURAL ASSET GENERATOR</div>
                <h2 style={{ fontSize: '20px', fontWeight: 900 }}>THUMBNAIL STUDIO</h2>
              </div>
              <button onClick={() => setActiveThumbnailClip(null)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 20px', borderRadius: '99px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>✕ CLOSE STUDIO</button>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Left: Preview Panel */}
              <div style={{ flex: 1.2, background: '#050508', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}>
                   {isGeneratingThumb ? (
                     <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}>
                        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(244,185,66,0.2)', borderTopColor: '#F4B942', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }} />
                        <div style={{ fontSize: '11px', fontWeight: 900, color: '#F4B942', letterSpacing: '0.2em' }}>RENDERING CINEMATIC ASSET...</div>
                     </div>
                   ) : thumbnails[activeThumbnailClip.index]?.variants && thumbnails[activeThumbnailClip.index].variants!.length > 0 ? (
                     <img 
                        src={`/api/proxy-image?url=${encodeURIComponent(thumbnails[activeThumbnailClip.index].variants![selectedVariantIdx] || '')}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt="Neural Preview"
                     />
                   ) : (
                     <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>🖼</div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#A1A1AA' }}>AWAITING NEURAL RENDER</div>
                     </div>
                   )}
                </div>

                {/* Variant Selector */}
                {thumbnails[activeThumbnailClip.index]?.variants && thumbnails[activeThumbnailClip.index].variants!.length > 0 && (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    {thumbnails[activeThumbnailClip.index].variants!.map((vUrl, vIdx) => (
                      <div 
                        key={vIdx}
                        onClick={() => setSelectedVariantIdx(vIdx)}
                        style={{ 
                          width: '100px', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                          border: selectedVariantIdx === vIdx ? '2px solid #F4B942' : '2px solid transparent',
                          opacity: selectedVariantIdx === vIdx ? 1 : 0.5, transition: 'all 0.2s'
                        }}
                      >
                        <img src={`/api/proxy-image?url=${encodeURIComponent(vUrl)}`} alt="Thumbnail variant" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}

                {thumbnails[activeThumbnailClip.index]?.status === 'done' && (
                  <button onClick={handleGenerateThumbnail} style={{ marginTop: '24px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#A1A1AA', padding: '10px 24px', borderRadius: '99px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                    🔄 REGENERATE VARIANTS
                  </button>
                )}
              </div>

              {/* Right: Controls Panel */}
              <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <div style={{ marginBottom: '32px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 900, color: '#52525B', letterSpacing: '0.1em', display: 'block', marginBottom: '12px' }}>TEXT OVERLAY (HOOK TITLE)</label>
                  <textarea 
                    value={thumbPrompt}
                    onChange={(e) => setThumbPrompt(e.target.value)}
                    placeholder="Enter the main hook for your thumbnail..."
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', color: '#fff', fontSize: '14px', lineHeight: 1.5, minHeight: '100px', resize: 'none', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ marginBottom: '40px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 900, color: '#52525B', letterSpacing: '0.1em', display: 'block', marginBottom: '16px' }}>CINEMATIC STYLE</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                    {THUMB_STYLES.map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => setThumbStyle(s.id)}
                        style={{ 
                          padding: '16px', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s',
                          background: thumbStyle === s.id ? 'rgba(244,185,66,0.08)' : 'rgba(255,255,255,0.02)',
                          border: thumbStyle === s.id ? '1px solid #F4B942' : '1px solid rgba(255,255,255,0.05)',
                          display: 'flex', alignItems: 'center', gap: '14px'
                        }}
                      >
                        <div style={{ fontSize: '20px' }}>{s.icon}</div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 900, color: thumbStyle === s.id ? '#F4B942' : '#fff' }}>{s.name}</div>
                          <div style={{ fontSize: '10px', color: '#52525B' }}>Preset neural instructions</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 'auto' }}>
                   {thumbnails[activeThumbnailClip.index]?.status === 'done' ? (
                     <a 
                       href={thumbnails[activeThumbnailClip.index].variants?.[selectedVariantIdx] || thumbnails[activeThumbnailClip.index].url} 
                       download 
                       target="_blank"
                       className="shimmer-btn" 
                       style={{ width: '100%', padding: '20px', fontSize: '12px', textAlign: 'center', textDecoration: 'none', display: 'block', background: 'linear-gradient(90deg, #F59E0B, #FBBF24)' }}
                     >
                       DOWNLOAD 16:9 ASSET
                     </a>
                   ) : (
                     <button 
                       onClick={handleGenerateThumbnail}
                       disabled={isGeneratingThumb}
                       className="shimmer-btn" 
                       style={{ width: '100%', padding: '20px', fontSize: '12px', opacity: isGeneratingThumb ? 0.5 : 1 }}
                     >
                       {isGeneratingThumb ? 'RENDERING...' : 'START NEURAL RENDER'}
                     </button>
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <VesperTour forceOpen={showTour} onClose={() => setShowTour(false)} />
        </div>
      </div>
    </div>
  );
}

function ToolCard({ title, desc, onClick, loading }: { title: string; desc: string; onClick?: () => void; loading?: boolean }) {
  return (
    <div className="glass-panel" style={{ padding: '36px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.3s', cursor: onClick ? 'pointer' : 'default' }}>
      <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>{title}</h3>
      <p style={{ fontSize: '14px', color: '#A1A1AA', lineHeight: 1.6, flex: 1 }}>{desc}</p>
      <button
        onClick={onClick}
        disabled={loading || !onClick}
        className="shimmer-btn"
        style={{ width: '100%', padding: '12px', fontSize: '11px', opacity: (loading || !onClick) ? 0.5 : 1, cursor: onClick ? 'pointer' : 'not-allowed' }}
      >
        {loading ? 'GENERATING...' : `ACTIVATE ${title.toUpperCase()}`}
      </button>
    </div>
  );
}

function CarouselModal({ data, onClose }: { data: { slides: { slide_number: number; heading: string; content: string }[]; post_caption: string }; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div className="animate-up glass-panel" style={{ padding: '48px', width: '100%', maxWidth: '860px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>Kingdom <span style={{ color: '#8B5CF6' }}>Carousel</span></h2>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {data.slides.map((slide) => (
            <div key={slide.slide_number} className="glass-panel" style={{ padding: '28px', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: '9px', color: '#8B5CF6', fontWeight: 900, marginBottom: '12px', letterSpacing: '0.2em' }}>SLIDE {slide.slide_number}</div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px', lineHeight: 1.2 }}>{slide.heading}</h4>
              <p style={{ fontSize: '13px', color: '#A1A1AA', lineHeight: 1.6 }}>{slide.content}</p>
            </div>
          ))}
        </div>
        <div className="glass-panel" style={{ padding: '32px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 900, marginBottom: '14px', color: '#8B5CF6', letterSpacing: '0.2em' }}>OPTIMIZED CAPTION</h4>
          <p style={{ fontSize: '14px', color: '#fff', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{data.post_caption}</p>
          <button onClick={() => { navigator.clipboard.writeText(data.post_caption); toast.success('Caption copied!'); }}
            className="shimmer-btn" style={{ marginTop: '24px', padding: '14px 28px', fontSize: '11px' }}>
            COPY CAPTION
          </button>
        </div>
      </div>
    </div>
  );
}

class ResultsErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
          <div style={{ maxWidth: '500px' }}>
            <div style={{ fontSize: '48px', marginBottom: '24px' }}>⚠️</div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '16px' }}>Something went wrong</h2>
            <p style={{ color: '#A1A1AA', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
              {this.state.error || 'An unexpected error occurred while loading your media kit.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="shimmer-btn"
              style={{ padding: '14px 32px', fontSize: '12px' }}
            >
              RELOAD PAGE
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Results() {
  return (
    <ResultsErrorBoundary>
      <main style={{ minHeight: '100vh', background: '#0A0A0F', color: '#fff' }}>
        <div className="spiritual-rays" />
        <div className="vesper-bg" style={{ opacity: 0.15 }} />
        <Suspense fallback={null}>
          <ResultsContent />
        </Suspense>
      </main>
    </ResultsErrorBoundary>
  );
}