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
    <div className="space-y-12">
      <div className="max-w-3xl">
        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">5-Day Devotional Journey</h2>
        <p className="text-zinc-500 text-sm mt-3 font-medium">Equip your congregation with a week of focused spiritual growth.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-10">
        {devotional.map((day, index) => (
          <div key={index} className="glass-card overflow-hidden flex flex-col md:flex-row border-l-4 border-emerald-500 bg-zinc-900/40 border border-white/5 group">
            <div className="md:w-40 bg-emerald-500/5 flex flex-col items-center justify-center p-8 md:border-r border-white/5 relative">
              <div className="absolute top-0 left-0 w-full h-full bg-noise opacity-10 pointer-events-none" />
              <div className="relative text-center">
                <span className="text-sm font-black text-emerald-500/60 uppercase tracking-[0.3em] block mb-1">Session</span>
                <span className="text-6xl font-black text-white leading-none tracking-tighter">{day.day}</span>
              </div>
            </div>
            
            <div className="flex-grow p-8 md:p-12 space-y-8">
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{day.title}</h3>
                <div className="flex items-center gap-3 text-emerald-500 font-black text-sm uppercase tracking-widest">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {day.scripture}
                </div>
              </div>
              
              <p className="text-zinc-300 text-base leading-relaxed border-l-2 border-emerald-500/20 pl-8 font-medium">
                {day.devotional_reading}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 p-6 bg-zinc-950/50 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-sm font-black text-zinc-500 uppercase tracking-widest">Deep Reflection</span>
                  </div>
                  <p className="text-zinc-300 text-sm italic leading-relaxed font-medium">
                    &quot;{day.reflection_question}&quot;
                  </p>
                </div>
                <div className="space-y-4 p-6 bg-zinc-950/50 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-sm font-black text-zinc-500 uppercase tracking-widest">Prayer Focus</span>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                    {day.prayer_focus}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
