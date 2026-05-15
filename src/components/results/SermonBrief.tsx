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
    <div className="glass-card premium-border h-full flex flex-col gap-8" style={{ padding: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="vesper-badge badge-violet">SERMON BRIEF</div>
        <h3 className="title-xl" style={{ fontSize: '28px', lineHeight: 1.2 }}>
          {main_theme || 'Sermon Insight'}
        </h3>
        {tone && (
          <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.1em', opacity: 0.8 }}>
            TONE: {tone.toUpperCase()}
          </div>
        )}
      </div>
 
      {/* Tab nav */}
      <div style={{ display: 'flex', gap: '8px', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSummaryTab(tab.id)}
            className="vesper-btn"
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '11px',
              letterSpacing: '0.1em',
              background: summaryTab === tab.id ? 'var(--primary)' : 'transparent',
              border: 'none',
              boxShadow: summaryTab === tab.id ? '0 4px 15px rgba(139,92,246,0.3)' : 'none',
              color: summaryTab === tab.id ? '#fff' : 'var(--text-dim)'
            }}
          >
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>
 
      {/* Content */}
      <div style={{ flex: 1, minHeight: '200px', overflowY: 'auto' }} className="scrollbar-hide">
        <div key={summaryTab} className="animate-in">
          {summaryTab === 'one' && (
            <p style={{ color: 'var(--text-muted)', fontSize: '17px', lineHeight: 1.8, fontStyle: 'italic', borderLeft: '3px solid var(--primary)', paddingLeft: '24px' }}>
              &quot;{summaries?.one_minute_summary || 'Summary loading…'}&quot;
            </p>
          )}
          {summaryTab === 'bullets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {(summaries?.bullet_points || []).slice(0, 5).map((point, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '14px', marginTop: '2px' }}>{String(i + 1).padStart(2, '0')}</span>
                  <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.6, fontWeight: 500 }}>{point}</p>
                </div>
              ))}
            </div>
          )}
          {summaryTab === 'detailed' && (
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.8, fontWeight: 500 }}>
              {summaries?.detailed_summary || 'Detailed summary loading…'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
