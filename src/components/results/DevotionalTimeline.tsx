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
    <div className="space-y-6">
      <div className="pb-4 border-b border-stone-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">
            5-Day Plan
          </span>
        </div>
        <h2 className="text-2xl font-black text-stone-800 tracking-tight">Devotional Journey</h2>
        <p className="text-stone-500 text-sm mt-1">A week of focused spiritual growth for your congregation.</p>
      </div>

      <div className="space-y-4">
        {devotional.map((day, index) => (
          <div key={index} className="card overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Day number */}
              <div className="md:w-24 bg-emerald-50 border-b md:border-b-0 md:border-r border-emerald-100 flex items-center justify-center p-6">
                <div className="text-center">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Day</p>
                  <p className="text-4xl font-black text-emerald-700 leading-none">{day.day}</p>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-stone-800 tracking-tight">{day.title}</h3>
                  <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {day.scripture}
                  </div>
                </div>

                <p className="text-stone-600 text-sm leading-relaxed border-l-2 border-emerald-200 pl-4">
                  {day.devotional_reading}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Reflection</p>
                    <p className="text-stone-600 text-sm italic leading-relaxed">
                      &quot;{day.reflection_question}&quot;
                    </p>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Prayer Focus</p>
                    <p className="text-stone-600 text-sm leading-relaxed">{day.prayer_focus}</p>
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
