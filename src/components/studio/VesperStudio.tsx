'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface VesperStudioProps {
  selectedClip: any;
  onClose: () => void;
  videoId: string | null;
  videoUrl: string | null;
  playableVideoUrl: string | null;
  rendering: Record<number, { status: string; url?: string }>;
  renderProgress: Record<number, number>;
  startExport: (clip: any, settings: any) => void;
  isMobile: boolean;
  userStatus: any;
  parseTime: (timeStr: string) => number;
}

const TEMPLATES = [
  { id: 'professional', name: 'Professional', desc: 'Clean, centered, minimal text shadows.', color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.5)', fontStyle: 'normal' },
  { id: 'impact', name: 'Impact', desc: 'Bold violet color, heavy shadows, high visibility.', color: '#C4B5FD', textShadow: '0 4px 20px rgba(139,92,246,0.6)', fontStyle: 'italic' },
  { id: 'luxury', name: 'Luxury', desc: 'Gold/Amber hues, elegant spacing, premium feel.', color: '#FCD34D', textShadow: '0 2px 15px rgba(217,119,6,0.4)', fontStyle: 'normal' },
  { id: 'minimal', name: 'Minimal', desc: 'Pure white, no shadows, modern aesthetic.', color: '#ffffff', textShadow: 'none', fontStyle: 'normal' },
];

const FILTERS = [
  { id: 'none', name: 'RAW', css: 'none', preview: 'bg-zinc-900' },
  { id: 'cinema', name: 'CINEMA', css: 'contrast(1.1) saturate(1.1) brightness(0.95)', preview: 'bg-gradient-to-br from-gray-900 to-blue-900' },
  { id: 'warm', name: 'WARMTH', css: 'sepia(0.2) saturate(1.2) contrast(1.05)', preview: 'bg-gradient-to-br from-orange-900 to-red-900' },
  { id: 'vibrant', name: 'VIBRANT', css: 'saturate(1.5) contrast(1.1)', preview: 'bg-gradient-to-br from-purple-900 to-pink-900' },
  { id: 'noir', name: 'NOIR', css: 'grayscale(1) contrast(1.2)', preview: 'bg-gradient-to-br from-zinc-800 to-black' },
];

const FONTS = [
  { id: 'outfit', name: 'Outfit', family: 'Outfit, sans-serif', weight: 900, desc: 'Geometric & modern.' },
  { id: 'inter', name: 'Inter', family: 'Inter, sans-serif', weight: 800, desc: 'Neutral & readable.' },
  { id: 'roboto', name: 'Roboto', family: 'Roboto, sans-serif', weight: 900, desc: 'Classic industrial.' },
  { id: 'serif', name: 'Playfair', family: 'serif', weight: 900, desc: 'Elegant & traditional.' },
];

const ANIMATIONS = [
  { id: 'fade', name: 'SOFT FADE', desc: 'Gentle opacity transition.' },
  { id: 'slideUp', name: 'SLIDE UP', desc: 'Rising motion effect.' },
  { id: 'zoom', name: 'PULSE', desc: 'Subtle breathing motion.' },
  { id: 'reveal', name: 'REVEAL', desc: 'Typewriter-style disclosure.' },
];

const PLATFORMS = [
  { id: 'tiktok', icon: '📱', label: 'TikTok', format: '9:16 Vertical', limit: 2200, prefix: '#ministry #shorts ' },
  { id: 'insta', icon: '📸', label: 'Instagram', format: '9:16 Reel', limit: 2200, prefix: 'Reel from today: ' },
  { id: 'youtube', icon: '▶️', label: 'YT Shorts', format: '9:16 Vertical', limit: 500, prefix: '' },
  { id: 'x', icon: '𝕏', label: 'X', format: '1:1 / 9:16', limit: 280, prefix: 'Powerful moment: ' },
];

export default function VesperStudio({ 
  selectedClip, 
  onClose, 
  videoId, 
  videoUrl, 
  playableVideoUrl, 
  rendering, 
  renderProgress, 
  startExport, 
  isMobile, 
  userStatus,
  parseTime
}: VesperStudioProps) {
  
  const [activeTab, setActiveTab] = useState('templates');
  const [mobileTab, setMobileTab] = useState('style');
  
  const [selectedTemplate, setSelectedTemplate] = useState('minimal');
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [selectedFont, setSelectedFont] = useState('outfit');
  const [selectedAnimation, setSelectedAnimation] = useState('fade');
  
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [previewStart, setPreviewStart] = useState(0);
  const [previewEnd, setPreviewEnd] = useState(0);
  
  const [captionOverrides, setCaptionOverrides] = useState<Record<number, string>>({});
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Sync video state with controls
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(e => console.log('Autoplay blocked:', e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (selectedClip) {
      const start = parseTime(selectedClip.start);
      const end = parseTime(selectedClip.end);
      setTrimStart(start);
      setTrimEnd(end);
      setPreviewStart(start);
      setPreviewEnd(end);
    }
  }, [selectedClip, parseTime]);

  const handleStartExport = () => {
    const settings = {
      template: selectedTemplate,
      filter: selectedFilter,
      font: selectedFont,
      animation: selectedAnimation,
      trimStart,
      trimEnd,
      caption: captionOverrides[selectedClip.index] || selectedClip.suggested_captions?.[0] || selectedClip.main_quote
    };
    startExport(selectedClip, settings);
  };

  const isYouTubeSource = !!videoId;

  return (
    <div className="vesper-mesh-bg-container" style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#050508', display: 'flex', flexDirection: 'column', animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div className="vesper-mesh-bg" />
      
      {/* Top Bar — Global Controls */}
      <div className="glass-card" style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 15px var(--primary)' }} />
            <div>
              <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '0.3em', color: '#fff' }}>VESPER STUDIO</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700 }}>NEURAL EDITING SUITE V2.5</div>
            </div>
          </div>
          
          {!isMobile && (
            <div style={{ height: '32px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          )}

          {!isMobile && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="vesper-badge badge-violet" style={{ fontSize: '11px' }}>4K UPSCALE</div>
              <div className="vesper-badge badge-green" style={{ fontSize: '11px' }}>AI SYNC ACTIVE</div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="vesper-btn-outline shimmer-effect"
          style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '13px' }}
        >
          <span style={{ opacity: 0.6, marginRight: '8px' }}>✕</span> CLOSE EDITOR
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>
        
        {/* LEFT PANEL — Style tools */}
        <div className="studio-panel" style={{ 
          width: isMobile ? '100%' : '340px', 
          borderRight: '1px solid rgba(255,255,255,0.05)', 
          display: isMobile ? (mobileTab === 'style' ? 'flex' : 'none') : 'flex', 
          borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none',
          background: 'rgba(10, 10, 15, 0.4)'
        }}>

          {/* Navigation Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
            {[
              { id: 'templates', icon: '◈', label: 'Style' },
              { id: 'filters', icon: '◐', label: 'Filter' },
              { id: 'fonts', icon: 'Aa', label: 'Font' },
              { id: 'motion', icon: '▷', label: 'Motion' },
              { id: 'trim', icon: '✂', label: 'Trim' },
              { id: 'publish', icon: '↗', label: 'Sync' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? 'studio-tab-active' : ''}
                style={{
                  position: 'relative',
                  padding: '16px 4px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  color: 'var(--text-dim)'
                }}
              >
                <span style={{ fontSize: '20px', lineHeight: 1 }}>{tab.icon}</span>
                <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Header for current tab */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>EDITOR</div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>{activeTab.toUpperCase()}</h3>
            </div>

            {/* TEMPLATES */}
            {activeTab === 'templates' && TEMPLATES.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className="glass-card"
                style={{
                  padding: '16px', borderRadius: '16px', cursor: 'pointer',
                  background: selectedTemplate === t.id ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)',
                  borderColor: selectedTemplate === t.id ? 'var(--primary)' : 'var(--card-border)',
                  display: 'flex', alignItems: 'center', gap: '16px',
                }}
              >
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0, 
                  background: `linear-gradient(135deg, ${t.color}22, ${t.color}66)`, 
                  border: `1px solid ${t.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.color, boxShadow: `0 0 10px ${t.color}` }} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.desc}</div>
                </div>
              </div>
            ))}

            {/* FILTERS */}
            {activeTab === 'filters' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {FILTERS.map(f => (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFilter(f.id)}
                    className="glass-card"
                    style={{
                      borderRadius: '16px', cursor: 'pointer', overflow: 'hidden',
                      borderColor: selectedFilter === f.id ? 'var(--primary)' : 'var(--card-border)',
                      padding: 0
                    }}
                  >
                    <div style={{ height: '64px', background: f.preview.includes('bg-gradient') ? undefined : '#111', position: 'relative' }} className={f.preview}>
                      {selectedFilter === f.id && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-glow)', backdropFilter: 'blur(2px)' }}>
                          <span style={{ fontSize: '20px' }}>✓</span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '8px 4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: selectedFilter === f.id ? 'var(--secondary)' : 'var(--text-muted)', letterSpacing: '0.05em' }}>{f.name}</div>
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
                className="glass-card"
                style={{
                  padding: '14px', borderRadius: '16px', cursor: 'pointer',
                  background: selectedFont === f.id ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)',
                  borderColor: selectedFont === f.id ? 'var(--primary)' : 'var(--card-border)',
                  display: 'flex', alignItems: 'center', gap: '16px',
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: f.family, fontWeight: f.weight, fontSize: '18px', color: selectedFont === f.id ? 'var(--secondary)' : '#fff' }}>Aa</span>
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '2px', fontFamily: f.family }}>{f.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{f.desc}</div>
                </div>
              </div>
            ))}

            {/* MOTION */}
            {activeTab === 'motion' && ANIMATIONS.map(a => (
              <div
                key={a.id}
                onClick={() => setSelectedAnimation(a.id)}
                className="glass-card"
                style={{
                  padding: '14px', borderRadius: '16px', cursor: 'pointer',
                  background: selectedAnimation === a.id ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)',
                  borderColor: selectedAnimation === a.id ? 'var(--primary)' : 'var(--card-border)',
                  display: 'flex', alignItems: 'center', gap: '16px',
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  {a.id === 'fade' ? '✦' : a.id === 'slideUp' ? '↑' : a.id === 'zoom' ? '⊕' : '▶'}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>{a.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.desc}</div>
                </div>
              </div>
            ))}

            {/* TRIM TAB */}
            {activeTab === 'trim' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ padding: '24px', background: 'rgba(139, 92, 246, 0.04)', borderRadius: '20px', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.2em', marginBottom: '20px', textTransform: 'uppercase' }}>Precision Boundaries</div>
                  
                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#71717A', fontWeight: 800 }}>START POINT</span>
                      <span style={{ fontSize: '16px', color: '#fff', fontWeight: 900, fontFamily: 'monospace' }}>{Math.floor(trimStart/60)}:{String(trimStart%60).padStart(2,'0')}</span>
                    </div>
                    <input
                      type="range"
                      min={Math.max(0, parseTime(selectedClip.start) - 60)}
                      max={trimEnd - 1}
                      value={trimStart}
                      onChange={e => setTrimStart(Number(e.target.value))}
                      onMouseUp={() => { setPreviewStart(trimStart); setPreviewEnd(trimEnd); }}
                      style={{ width: '100%', accentColor: '#8B5CF6', height: '6px', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#71717A', fontWeight: 800 }}>END POINT</span>
                      <span style={{ fontSize: '16px', color: '#fff', fontWeight: 900, fontFamily: 'monospace' }}>{Math.floor(trimEnd/60)}:{String(trimEnd%60).padStart(2,'0')}</span>
                    </div>
                    <input
                      type="range"
                      min={trimStart + 1}
                      max={parseTime(selectedClip.end) + 60}
                      value={trimEnd}
                      onChange={e => setTrimEnd(Number(e.target.value))}
                      onMouseUp={() => { setPreviewStart(trimStart); setPreviewEnd(trimEnd); }}
                      style={{ width: '100%', accentColor: '#8B5CF6', height: '6px', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', color: '#52525B', fontWeight: 900, textTransform: 'uppercase' }}>Total Length</span>
                      <span style={{ fontSize: '18px', color: '#fff', fontWeight: 900 }}>{trimEnd - trimStart}s</span>
                    </div>
                    <div style={{ padding: '6px 12px', borderRadius: '8px', background: trimEnd - trimStart > 60 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${trimEnd - trimStart > 60 ? '#EF444433' : '#10B98133'}`, color: trimEnd - trimStart > 60 ? '#EF4444' : '#10B981', fontSize: '12px', fontWeight: 900 }}>
                      {trimEnd - trimStart > 60 ? '⚠️ OVER LIMIT' : '✓ READY'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PUBLISH TAB */}
            {activeTab === 'publish' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '44px', marginBottom: '16px' }}>▶️</div>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>Push to YouTube</h3>
                  <p style={{ fontSize: '14px', color: '#71717A', marginBottom: '24px', lineHeight: 1.5 }}>
                    Instantly broadcast this cinematic clip as a YouTube Short.
                  </p>
                  
                  {rendering[selectedClip.index]?.status === 'complete' ? (
                    <button 
                      onClick={() => toast.success('Syncing with YouTube...')}
                      className="shimmer-btn"
                      style={{ width: '100%', padding: '16px', borderRadius: '14px', fontSize: '15px', fontWeight: 900 }}
                    >
                      {userStatus?.youtubeConnected ? 'INSTANT PUBLISH' : 'CONNECT CHANNEL'}
                    </button>
                  ) : (
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', fontSize: '14px', color: '#52525B', fontWeight: 800 }}>
                      RENDER REQUIRED
                    </div>
                  )}
                </div>

                <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '44px', marginBottom: '16px' }}>📸</div>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>Instagram / TikTok</h3>
                  <p style={{ fontSize: '14px', color: '#71717A', marginBottom: '24px', lineHeight: 1.5 }}>
                    Download the reel asset and use the pre-generated social kit to post.
                  </p>
                  <button 
                    onClick={() => window.open(rendering[selectedClip.index]?.url)}
                    disabled={rendering[selectedClip.index]?.status !== 'complete'}
                    style={{ width: '100%', padding: '16px', borderRadius: '14px', fontSize: '15px', fontWeight: 900, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}
                  >
                    DOWNLOAD MP4
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Export Panel at bottom of Left Sidebar */}
          <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, background: 'rgba(0,0,0,0.3)' }}>
            <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(139,92,246,0.05)', borderRadius: '16px', border: '1px solid rgba(139,92,246,0.1)' }}>
              <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.15em', marginBottom: '8px', textTransform: 'uppercase' }}>Active Profile</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ color: '#fff', fontWeight: 800 }}>{TEMPLATES.find(t => t.id === selectedTemplate)?.name}</span>
                <span style={{ opacity: 0.3 }}>•</span>
                <span style={{ color: '#fff', fontWeight: 800 }}>{FILTERS.find(f => f.id === selectedFilter)?.name}</span>
                <span style={{ opacity: 0.3 }}>•</span>
                <span style={{ color: '#fff', fontWeight: 800 }}>{FONTS.find(f => f.id === selectedFont)?.name}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => toast.success('Profile Saved')}
                className="vesper-btn-outline"
                style={{ width: '56px', flexShrink: 0, padding: 0, borderRadius: '14px', fontSize: '20px' }}
                title="Save Profile"
              >
                💾
              </button>
              {rendering[selectedClip.index]?.status === 'complete' ? (
                <div style={{ flex: 1, display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => window.open(rendering[selectedClip.index]?.url)}
                    className="vesper-btn vesper-btn-primary shimmer-effect"
                    style={{ flex: 1, background: 'linear-gradient(90deg, #10B981, #059669)', fontSize: '14px' }}
                  >
                    📥 DOWNLOAD REEL
                  </button>
                  <button
                    onClick={handleStartExport}
                    className="vesper-btn-outline"
                    style={{ padding: '0 16px', fontSize: '12px', whiteSpace: 'nowrap' }}
                    title="Render with current settings"
                  >
                    RE-RENDER
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartExport}
                  className="vesper-btn vesper-btn-primary shimmer-effect"
                  disabled={rendering[selectedClip.index]?.status === 'loading'}
                  style={{ 
                    flex: 1, 
                    opacity: rendering[selectedClip.index]?.status === 'loading' ? 0.6 : 1, 
                    fontSize: '14px'
                  }}
                >
                  {rendering[selectedClip.index]?.status === 'loading'
                    ? `RENDERING... ${renderProgress[selectedClip.index] || 0}%`
                    : 'GENERATE CINEMATIC REEL'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PANEL 2: CENTER (Cinematic Preview) */}
        <div style={{ 
          flex: 1, 
          position: 'relative', 
          background: 'transparent', 
          display: isMobile ? (mobileTab === 'preview' ? 'flex' : 'none') : 'flex',
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: isMobile ? '20px 16px' : '40px',
          overflow: 'hidden',
        }}>
          {/* Subtle Background Glows */}
          <div style={{ position: 'absolute', top: '20%', left: '20%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
          
          {/* Phone Mockup Frame */}
          <div className="premium-border" style={{ 
            width: 'min(360px, 50vh)', 
            aspectRatio: '9/19.5', 
            background: '#000', 
            borderRadius: '48px', 
            border: '12px solid #1A1A1F', 
            boxShadow: '0 50px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
            position: 'relative',
            overflow: 'hidden',
            zIndex: 10,
            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Camera / Dynamic Island */}
            <div style={{ position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', width: '90px', height: '28px', background: '#000', borderRadius: '14px', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#111' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#080815' }} />
            </div>

            {/* Video Container */}
            <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
              {videoId ? (
                <iframe
                  style={{ width: '100%', height: '100%', border: 'none', transform: 'scale(1.05)', filter: FILTERS.find(f => f.id === selectedFilter)?.css || 'none' }}
                  src={`https://www.youtube.com/embed/${videoId}?start=${previewStart}&end=${previewEnd}&autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0`}
                  allow="autoplay; encrypted-media"
                />
              ) : videoUrl && (
                <video 
                  ref={videoRef}
                  src={`${playableVideoUrl || ''}#t=${previewStart},${previewEnd}`}
                  loop playsInline autoPlay muted={isMuted}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: FILTERS.find(f => f.id === selectedFilter)?.css || 'none' }}
                />
              )}

              {/* Playback Controls Overlay */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 50, display: 'flex', gap: '20px' }}>
                {!isPlaying && (
                  <button 
                    onClick={() => setIsPlaying(true)}
                    style={{ background: 'rgba(139,92,246,0.8)', border: 'none', color: '#fff', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)', boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}
                  >
                    <span style={{ fontSize: '24px', marginLeft: '4px' }}>▶</span>
                  </button>
                )}
              </div>

              {/* Bottom Controls Bar */}
              <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '100px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', zIndex: 40, display: 'flex', alignItems: 'flex-end', padding: '0 24px 24px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
                  >
                    <span style={{ fontSize: '18px' }}>{isPlaying ? '⏸' : '▶'}</span>
                  </button>
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
                  >
                    <span style={{ fontSize: '18px' }}>{isMuted ? '🔇' : '🔊'}</span>
                  </button>
                </div>
                
                <div style={{ fontSize: '12px', fontWeight: 900, color: '#fff', letterSpacing: '0.1em', opacity: 0.8, marginBottom: '10px' }}>
                  PREVIEW MODE
                </div>
              </div>

              {/* Caption Overlay Preview */}
              <div style={{ position: 'absolute', bottom: '22%', left: '8%', right: '8%', zIndex: 20 }}>
                <div
                  key={selectedAnimation}
                  style={{
                    textAlign: 'center',
                    color: TEMPLATES.find(t => t.id === selectedTemplate)?.color || '#fff',
                    fontFamily: FONTS.find(f => f.id === selectedFont)?.family || 'inherit',
                    fontWeight: FONTS.find(f => f.id === selectedFont)?.weight || 900,
                    fontSize: isMobile ? '22px' : '20px',
                    textShadow: TEMPLATES.find(t => t.id === selectedTemplate)?.textShadow || 'none',
                    fontStyle: TEMPLATES.find(t => t.id === selectedTemplate)?.fontStyle || 'normal',
                    textTransform: 'uppercase',
                    lineHeight: 1.1,
                    animation: `vesper-${selectedAnimation} 2.5s ease-in-out infinite`,
                  }}
                >
                  {captionOverrides[selectedClip.index] || selectedClip.suggested_captions?.[0] || selectedClip.main_quote}
                </div>
              </div>

              {/* Video Overlay Polish */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.4) 100%)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Quick Caption Edit Overlay */}
          <div style={{ width: '100%', maxWidth: '330px', marginTop: '24px', position: 'relative', zIndex: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#52525B', letterSpacing: '0.15em' }}>LIVE CAPTION EDITOR</span>
              <span style={{ fontSize: '11px', color: '#8B5CF6', fontWeight: 800 }}>AUTO-SAVED</span>
            </div>
            <textarea
              value={captionOverrides[selectedClip?.index] ?? (selectedClip?.suggested_captions?.[0] || selectedClip?.main_quote || '')}
              onChange={e => setCaptionOverrides(prev => ({ ...prev, [selectedClip.index]: e.target.value }))}
              rows={2}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px',
                padding: '16px', color: '#fff', fontSize: '15px',
                lineHeight: 1.4, resize: 'none', fontFamily: 'inherit',
                outline: 'none', transition: 'all 0.2s',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
              }}
              onFocus={(e) => e.target.style.border = '1px solid rgba(139,92,246,0.4)'}
              onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.08)'}
            />
          </div>
          
          {/* Hardware Specs Display */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', opacity: 0.5 }}>
            {['1080x1920', '60 FPS', 'HEVC'].map(spec => (
              <div key={spec} style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.2em', color: '#fff', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '99px' }}>
                {spec}
              </div>
            ))}
          </div>
        </div>

        {/* PANEL 3: RIGHT SIDEBAR — Social Kit */}
        <div className="studio-panel" style={{ 
          width: isMobile ? '100%' : '380px', 
          borderLeft: '1px solid rgba(255,255,255,0.05)', 
          display: isMobile ? ((mobileTab === 'social' || mobileTab === 'export') ? 'flex' : 'none') : 'flex', 
          borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderRight: 'none',
          background: 'rgba(10, 10, 15, 0.4)'
        }}>

          {/* Header */}
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
            <div className="vesper-badge badge-green" style={{ marginBottom: '8px' }}>MEDIA KIT GENERATED</div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>Social Distribution</h3>
          </div>

          {/* Social Platforms List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Engagement Hook Card */}
            <div className="glass-card premium-border" style={{ padding: '20px', background: 'var(--primary-glow)', borderColor: 'rgba(139,92,246,0.3)' }}>
              <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--secondary)', letterSpacing: '0.15em', marginBottom: '10px', textTransform: 'uppercase' }}>Engagement Hook</div>
              <p style={{ fontSize: '17px', color: '#fff', lineHeight: 1.5, margin: 0, fontWeight: 700 }}>
                &ldquo;{selectedClip.engagement_hook || 'Dynamic theological insight captured.'}&rdquo;
              </p>
            </div>

            {PLATFORMS.map((p, pi) => {
              const caption = selectedClip.suggested_captions?.[pi] || selectedClip.suggested_captions?.[0] || selectedClip.main_quote || '';
              const fullText = `${p.prefix}${caption}`;
              const charCount = fullText.length;
              const overLimit = p.limit ? charCount > p.limit : false;
              
              return (
                <div key={p.id} className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>{p.icon}</span>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>{p.label}</span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: overLimit ? 'var(--error)' : 'var(--text-dim)', fontFamily: 'monospace' }}>
                      {charCount}{p.limit ? `/${p.limit}` : ''}
                    </div>
                  </div>
                  <div style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, maxHeight: '140px', overflowY: 'auto' }}>
                    {fullText}
                  </div>
                  <div style={{ padding: '12px 16px 16px' }}>
                    <button
                      onClick={() => { navigator.clipboard.writeText(fullText); toast.success(`${p.label} Copied`); }}
                      className="vesper-btn-outline shimmer-effect"
                      style={{ width: '100%', padding: '10px', fontSize: '12px', borderRadius: '10px' }}
                    >
                      COPY CAPTION
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Final Export Action on Mobile only */}
          {isMobile && mobileTab === 'export' && (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button 
                onClick={handleStartExport}
                className="vesper-btn vesper-btn-primary shimmer-effect"
                style={{ width: '100%', padding: '20px', fontSize: '16px' }}
              >
                RENDER FINAL REEL
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="glass-card" style={{ 
          height: '84px', borderRadius: '24px 24px 0 0', borderBottom: 'none', borderLeft: 'none', borderRight: 'none',
          display: 'flex', zIndex: 100, paddingBottom: '12px' 
        }}>
          {[
            { id: 'style', label: 'STYLE', icon: '🎨' },
            { id: 'preview', label: 'PREVIEW', icon: '📱' },
            { id: 'social', label: 'SOCIAL', icon: '📋' },
            { id: 'export', label: 'FINISH', icon: '🚀' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                background: 'none', border: 'none',
                color: mobileTab === tab.id ? 'var(--primary)' : 'var(--text-dim)',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '24px', filter: mobileTab === tab.id ? 'drop-shadow(0 0 8px var(--primary-glow))' : 'none' }}>{tab.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.1em' }}>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Global CSS for Vesper Animations */}
      <style jsx global>{`
        @keyframes vesper-fade {
          0%, 100% { opacity: 0; transform: translateY(5px); }
          10%, 90% { opacity: 1; transform: translateY(0); }
        }
        @keyframes vesper-slideUp {
          0% { transform: translateY(40px); opacity: 0; }
          15%, 85% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        @keyframes vesper-zoom {
          0%, 100% { transform: scale(0.9); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes vesper-reveal {
          0% { clip-path: inset(0 100% 0 0); }
          20%, 80% { clip-path: inset(0 0 0 0); }
          100% { clip-path: inset(0 0 0 100%); }
        }
      `}</style>
    </div>
  );
}
