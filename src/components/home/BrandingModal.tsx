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
    { name: 'Indigo', primary: '#4f46e5', accent: '#8b5cf6', template: 'Modern Cinematic' },
    { name: 'Gold', primary: '#d97706', accent: '#f59e0b', template: 'Dark Moody Gold' },
    { name: 'Sky', primary: '#0284c7', accent: '#38bdf8', template: 'Light Minimalist' },
    { name: 'Rose', primary: '#e11d48', accent: '#fb7185', template: 'Vibrant Creative' },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-stone-100">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-0.5">Customize</p>
            <h2 className="text-xl font-black text-stone-800 tracking-tight">Branding Studio</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-all"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-stone-100">

          {/* Left: Controls */}
          <div className="p-8 space-y-7">

            {/* Presets */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-widest text-stone-400">Quick Presets</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setBranding({ ...branding, primaryColor: p.primary, accentColor: p.accent, template: p.template })}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-white text-sm font-medium text-stone-600 transition-all"
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.primary }} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Style + Fonts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-stone-400">Visual Style</label>
                <select
                  value={branding.template}
                  onChange={(e) => setBranding({ ...branding, template: e.target.value })}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 text-sm font-medium focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                >
                  <option>Modern Cinematic</option>
                  <option>Dark Moody Gold</option>
                  <option>Light Minimalist</option>
                  <option>Vibrant Creative</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-stone-400">Typography</label>
                <input
                  type="text"
                  value={branding.fonts}
                  onChange={(e) => setBranding({ ...branding, fonts: e.target.value })}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 text-sm font-medium focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { label: 'Primary Color', key: 'primaryColor' as const },
                { label: 'Accent Color', key: 'accentColor' as const },
              ].map(({ label, key }) => (
                <div key={key} className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-stone-400">{label}</label>
                  <div className="flex items-center gap-3 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl">
                    <input
                      type="color"
                      value={branding[key]}
                      onChange={(e) => setBranding({ ...branding, [key]: e.target.value })}
                      className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding[key]}
                      onChange={(e) => setBranding({ ...branding, [key]: e.target.value })}
                      className="bg-transparent text-stone-600 text-sm font-mono w-20 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-stone-400">Logo Description</label>
              <textarea
                placeholder="Describe your church logo for AI image generation…"
                value={branding.logoDescription}
                onChange={(e) => setBranding({ ...branding, logoDescription: e.target.value })}
                rows={2}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 text-sm font-medium focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
              />
            </div>
          </div>

          {/* Right: Preview + Actions */}
          <div className="p-8 flex flex-col gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-stone-400">Preview</label>
              <div
                className="relative rounded-xl overflow-hidden h-52 flex flex-col justify-end p-6"
                style={{ background: `linear-gradient(135deg, ${branding.primaryColor}22, ${branding.accentColor}11)` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent" />
                <div className="relative space-y-2">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    Clip 01
                  </span>
                  <p className="text-white font-black text-lg leading-tight">The Power of Choice</p>
                  <div className="w-10 h-0.5 rounded-full" style={{ backgroundColor: branding.accentColor }} />
                  <p className="text-white/60 text-xs">{branding.template} style</p>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <button
                onClick={async () => {
                  if (confirm('Clear all temporary sermon files? This cannot be undone.')) {
                    const res = await fetch('/api/cleanup', { method: 'POST' });
                    const data = await res.json();
                    alert(data.message || 'Cache cleared');
                  }
                }}
                className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-500 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-red-100"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.895-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Studio Cache
              </button>

              <button
                onClick={onClose}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-indigo-200"
              >
                Apply Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
