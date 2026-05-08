'use client';

interface DevotionalDay {
  day: number;
  title: string;
  scripture: string;
  devotional_reading: string;
  reflection_question: string;
  prayer_focus: string;
}

interface DevotionalTimelineProps {
  devotional: DevotionalDay[];
}

export default function DevotionalTimeline({ devotional }: DevotionalTimelineProps) {
  return (
    <div className="space-y-12 animate-fade">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-[1px] bg-emerald-500/30" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Growth Engine</span>
        </div>
        <h2 className="text-4xl font-extrabold text-white tracking-tighter">5-Day Devotional Journey</h2>
        <p className="text-white/30 text-sm max-w-xl font-medium">A structured spiritual growth plan for your congregation based on the core sermon themes.</p>
      </div>

      <div className="space-y-8">
        {devotional.map((day, index) => (
          <div key={index} className="glass-card !p-0 overflow-hidden border-white/5 hover:border-emerald-500/30 transition-all duration-500 group">
            <div className="flex flex-col md:flex-row">
              {/* Day Number Column */}
              <div className="md:w-32 bg-emerald-500/5 border-b md:border-b-0 md:border-r border-white/5 flex items-center justify-center p-8 group-hover:bg-emerald-500/10 transition-colors">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] mb-1">Day</p>
                  <p className="text-6xl font-black text-white leading-none tracking-tighter">{day.day}</p>
                </div>
              </div>

              {/* Content Column */}
              <div className="flex-1 p-8 space-y-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold text-white tracking-tighter group-hover:text-emerald-500 transition-colors">{day.title}</h3>
                  <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {day.scripture}
                  </div>
                </div>

                <p className="text-white/60 text-base leading-relaxed italic border-l-4 border-emerald-500/30 pl-6">
                  {day.devotional_reading}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Reflection Question</p>
                    <p className="text-white/60 text-sm italic leading-relaxed font-medium">
                      &quot;{day.reflection_question}&quot;
                    </p>
                  </div>
                  <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Prayer Focus</p>
                    <p className="text-white/60 text-sm leading-relaxed font-medium">{day.prayer_focus}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
