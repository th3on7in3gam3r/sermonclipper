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
    { id: 'one' as const, label: 'Hook' },
    { id: 'bullets' as const, label: 'Takeaways' },
    { id: 'detailed' as const, label: 'Summary' },
  ];

  return (
    <div className="card p-6 h-full flex flex-col gap-5">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Sermon Brief</p>
        <h3 className="text-lg font-black text-stone-800 leading-tight tracking-tight">
          {main_theme || 'Sermon Insight'}
        </h3>
        {tone && (
          <span className="inline-block px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold rounded-full">
            {tone}
          </span>
        )}
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 bg-stone-100 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSummaryTab(tab.id)}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
              summaryTab === tab.id
                ? 'bg-white text-indigo-600 shadow-sm border border-stone-200'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-[160px]">
        <div key={summaryTab} className="animate-fade-in-up">
          {summaryTab === 'one' && (
            <p className="text-stone-600 text-sm leading-relaxed italic border-l-2 border-indigo-200 pl-4">
              &quot;{summaries?.one_minute_summary || 'Summary loading…'}&quot;
            </p>
          )}
          {summaryTab === 'bullets' && (
            <ul className="space-y-3">
              {(summaries?.bullet_points || []).slice(0, 5).map((point, i) => (
                <li key={i} className="flex gap-3 text-stone-600 text-sm">
                  <span className="text-indigo-400 font-bold shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          )}
          {summaryTab === 'detailed' && (
            <p className="text-stone-600 text-sm leading-relaxed">
              {summaries?.detailed_summary || 'Detailed summary loading…'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
