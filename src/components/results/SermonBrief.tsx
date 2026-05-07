'use client';

interface SermonBriefProps {
  summaries?: {
    one_minute_summary?: string;
    bullet_points?: string[];
    detailed_summary?: string;
  };
  main_theme?: string;
  tone?: string;
  summaryTab: 'one' | 'bullets' | 'detailed';
  setSummaryTab: (tab: 'one' | 'bullets' | 'detailed') => void;
}

export default function SermonBrief({ summaries, main_theme, tone, summaryTab, setSummaryTab }: SermonBriefProps) {
  if (!main_theme && !summaries) return null;

  return (
    <div className="relative group animate-fade-in h-full">
      {/* Decorative Glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-br from-violet-500/20 to-transparent rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
      
      <div className="relative glass-card-premium p-6 md:p-8 rounded-[2rem] border border-white/10 bg-zinc-950/40 backdrop-blur-3xl overflow-hidden h-full">
        {/* Background Graphic */}
        <div className="absolute top-4 right-4 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
          <svg className="w-32 h-32 rotate-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z" />
          </svg>
        </div>
        
        <div className="relative z-10 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-sm font-black text-zinc-500 uppercase tracking-[0.4em]">Executive Briefing</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter leading-tight max-w-2xl">
                {main_theme || 'Sermon Insight'}
              </h2>
            </div>
            <div className="space-y-3 md:text-right">
              <span className="text-sm font-black text-zinc-500 uppercase tracking-[0.35em]">Sermon Tone</span>
              <div className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-full inline-block mt-2 backdrop-blur-xl">
                <span className="text-white font-black text-sm uppercase tracking-[0.2em]">{tone || 'Impactful'}</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="space-y-10">
            <nav className="flex flex-nowrap gap-4 border-b border-white/5 overflow-x-auto min-w-0">
              {[
                { id: 'one', label: 'The Hook' },
                { id: 'bullets', label: 'Takeaways' },
                { id: 'detailed', label: 'Summary' }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setSummaryTab(tab.id as 'one' | 'bullets' | 'detailed')}
                  className={`relative whitespace-nowrap pb-4 px-4 text-sm font-black uppercase tracking-[0.12em] transition-all ${
                    summaryTab === tab.id ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                  {summaryTab === tab.id && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.6)]" />
                  )}
                </button>
              ))}
            </nav>

            {/* Content Display */}
            <div className="min-h-[200px] py-2">
              <div key={summaryTab} className="animate-fade-in-up">
                {summaryTab === 'one' && (
                  <div className="relative">
                    <div className="absolute -left-6 top-0 bottom-0 w-[2px] bg-gradient-to-b from-violet-500 to-transparent opacity-30" />
                    <p className="text-zinc-200 text-base md:text-lg leading-7 font-medium italic tracking-tight">
                      &quot;{summaries?.one_minute_summary}&quot;
                    </p>
                  </div>
                )}
                {summaryTab === 'bullets' && (
                  <ul className="space-y-6">
                    {summaries?.bullet_points?.slice(0, 5).map((point, i) => (
                      <li key={i} className="flex gap-4 text-zinc-300 group/item">
                          <span className="text-violet-500 font-black text-base opacity-40 group-hover/item:opacity-100 transition-all transform group-hover/item:scale-110">
                            0{i + 1}
                          </span>
                          <span className="text-sm leading-relaxed font-medium">{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {summaryTab === 'detailed' && (
                  <div className="space-y-4">
                    <p className="text-zinc-400 text-sm md:text-base leading-[1.8] font-medium">
                      {summaries?.detailed_summary}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
