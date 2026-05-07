'use client';

interface Branding {
  template: string;
  primaryColor: string;
  accentColor: string;
  logoDescription: string;
  fonts: string;
}

interface BrandingModalProps {
  branding: Branding;
  setBranding: (branding: Branding) => void;
  onClose: () => void;
}

export default function BrandingModal({ branding, setBranding, onClose }: BrandingModalProps) {
  const PRESETS = [
    { name: 'Midnight', primary: '#8b5cf6', accent: '#d946ef', template: 'Modern Cinematic' },
    { name: 'Golden Hour', primary: '#f59e0b', accent: '#fbbf24', template: 'Dark Moody Gold' },
    { name: 'Clean Grace', primary: '#0ea5e9', accent: '#38bdf8', template: 'Light Minimalist' },
  ];

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/95 backdrop-blur-2xl animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[calc(100vh-3rem)] glass-card-premium p-6 md:p-10 rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(139,92,246,0.2)] overflow-hidden overflow-y-auto">
        
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />

        <button 
          onClick={onClose}
          className="absolute top-8 right-8 flex items-center justify-center w-12 h-12 rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10 transition-all z-[110]"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
          </svg>
        </button>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
          
          {/* Left Side: Settings Lab */}
          <div className="space-y-10">
            <header className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-sm font-black text-zinc-500 uppercase tracking-[0.3em]">Design Lab</span>
              </div>
              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Branding Studio</h2>
            </header>

            <div className="space-y-8">
              {/* Presets Bar */}
              <div className="space-y-3">
                <label className="text-sm font-black text-zinc-600 uppercase tracking-widest">Quick Presets</label>
                <div className="flex flex-wrap gap-3">
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setBranding({...branding, primaryColor: p.primary, accentColor: p.accent, template: p.template})}
                      className="px-4 py-3 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 text-sm font-black uppercase tracking-widest transition-all text-zinc-400 hover:text-white"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-black text-zinc-500 uppercase tracking-widest">Visual Style</label>
                  <select 
                    value={branding.template}
                    onChange={(e) => setBranding({...branding, template: e.target.value})}
                    className="w-full p-4 bg-zinc-950 border border-white/5 rounded-2xl text-zinc-300 outline-none focus:border-violet-500 transition-all text-sm font-bold"
                  >
                    <option>Modern Cinematic</option>
                    <option>Dark Moody Gold</option>
                    <option>Light Minimalist</option>
                    <option>Vibrant Creative</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-black text-zinc-500 uppercase tracking-widest">Studio Typography</label>
                  <input 
                    type="text"
                    value={branding.fonts}
                    onChange={(e) => setBranding({...branding, fonts: e.target.value})}
                    className="w-full p-4 bg-zinc-950 border border-white/5 rounded-2xl text-zinc-300 outline-none focus:border-violet-500 transition-all text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-black text-zinc-500 uppercase tracking-widest">Primary DNA</label>
                  <div className="flex flex-wrap items-center gap-3 p-2 bg-zinc-950 border border-white/5 rounded-2xl">
                    <input 
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
                      className="w-10 h-10 rounded-xl overflow-hidden border-none bg-transparent cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
                      className="bg-transparent border-none text-zinc-400 outline-none text-sm font-mono w-24"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-black text-zinc-500 uppercase tracking-widest">Accent Glow</label>
                  <div className="flex flex-wrap items-center gap-3 p-2 bg-zinc-950 border border-white/5 rounded-2xl">
                    <input 
                      type="color"
                      value={branding.accentColor}
                      onChange={(e) => setBranding({...branding, accentColor: e.target.value})}
                      className="w-10 h-10 rounded-xl overflow-hidden border-none bg-transparent cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={branding.accentColor}
                      onChange={(e) => setBranding({...branding, accentColor: e.target.value})}
                      className="bg-transparent border-none text-zinc-400 outline-none text-sm font-mono w-24"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-zinc-500 uppercase tracking-widest">Logo Identification</label>
                <textarea 
                  placeholder="Describe your church logo for AI generation..."
                  value={branding.logoDescription}
                  onChange={(e) => setBranding({...branding, logoDescription: e.target.value})}
                  rows={2}
                  className="w-full p-4 bg-zinc-950 border border-white/5 rounded-2xl text-zinc-300 outline-none focus:border-violet-500 transition-all text-sm font-medium resize-none"
                />
              </div>
            </div>
          </div>

          {/* Right Side: Live Preview & Maintenance */}
          <div className="space-y-10 flex flex-col h-full">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-zinc-600 uppercase tracking-widest">Live Studio Preview</span>
              </div>
              
              <div className="relative group p-8 rounded-[2.5rem] bg-zinc-900/40 border border-white/10 overflow-hidden min-h-[300px] flex flex-col justify-end">
                {/* Simulated Clip Card */}
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60" />
                <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at top right, ${branding.primaryColor}, transparent)` }} />
                
                <div className="relative space-y-4">
                  <div className="inline-block px-3 py-1 rounded-full text-sm font-black uppercase tracking-widest" style={{ backgroundColor: branding.primaryColor, color: '#fff' }}>
                    Clip 01
                  </div>
                  <h4 className="text-xl font-black text-white uppercase italic leading-none tracking-tight">The Power of Choice</h4>
                  <div className="w-12 h-1 rounded-full" style={{ backgroundColor: branding.accentColor }} />
                  <p className="text-sm text-zinc-400 font-medium leading-relaxed">Previewing how your {branding.template} style will look on the final media assets.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="pt-6 border-t border-white/5">
                <button 
                  onClick={async () => {
                    if(confirm('Wipe all temporary sermon files? This cannot be undone.')) {
                      const res = await fetch('/api/cleanup', { method: 'POST' });
                      const data = await res.json();
                      alert(data.message || 'Cache cleared');
                    }
                  }}
                  className="w-full py-4 bg-red-500/5 hover:bg-red-500/10 text-red-500/40 hover:text-red-500 font-black rounded-2xl transition-all flex items-center justify-center gap-3 uppercase text-sm tracking-widest border border-red-500/10"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.895-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Reset Studio Cache
                </button>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black rounded-3xl uppercase text-sm tracking-[0.15em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_50px_rgba(139,92,246,0.3)]"
              >
                Apply Studio Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
