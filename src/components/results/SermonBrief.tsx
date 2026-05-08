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

  const tabs = [
    { id: 'one' as const, label: 'Core Hook' },
    { id: 'bullets' as const, label: 'Takeaways' },
    { id: 'detailed' as const, label: 'Summary' },
  ];

  return (
    <div className="glass-card h-full flex flex-col gap-6">
      {/* Header */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Sermon Brief</p>
        <h3 className="text-2xl font-extrabold text-white leading-tight tracking-tighter">
          {main_theme || 'Sermon Insight'}
        </h3>
        {tone && (
          <span className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full">
            {tone}
          </span>
        )}
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSummaryTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
              summaryTab === tab.id
                ? 'bg-primary text-white shadow-lg'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
        <div key={summaryTab} className="animate-fade">
          {summaryTab === 'one' && (
            <p className="text-white/60 text-base leading-relaxed italic border-l-4 border-primary pl-6">
              &quot;{summaries?.one_minute_summary || 'Summary loading…'}&quot;
            </p>
          )}
          {summaryTab === 'bullets' && (
            <ul className="space-y-5">
              {(summaries?.bullet_points || []).slice(0, 5).map((point, i) => (
                <li key={i} className="flex gap-4 text-white/70 text-sm">
                  <span className="text-primary font-black shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                  <span className="leading-relaxed font-medium">{point}</span>
                </li>
              ))}
            </ul>
          )}
          {summaryTab === 'detailed' && (
            <p className="text-white/60 text-sm leading-relaxed font-medium">
              {summaries?.detailed_summary || 'Detailed summary loading…'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
