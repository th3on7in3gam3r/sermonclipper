'use client';

import { useEffect, useState, useRef } from 'react';

interface ProcessingViewProps {
  steps: { id: string; label: string }[];
  currentStepIndex: number;
  statusMessage: string;
}

export default function ProcessingView({ steps, currentStepIndex, statusMessage }: ProcessingViewProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (statusMessage) {
      setLogs(prev => [...prev, statusMessage].slice(-4));
    }
  }, [statusMessage]);

  const progressPercent = Math.min(100, Math.max(5, ((currentStepIndex + 1) / steps.length) * 100));

  return (
    <div className="space-y-10 animate-fade">
      {/* Mini Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
          <span>{steps[currentStepIndex]?.label || 'Resolving'}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-1000 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-white leading-tight">
          {statusMessage || 'Initializing Neural Engine…'}
        </h2>
        <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">
          Suite Assembly in Progress
        </p>
      </div>

      {/* Mini Console */}
      <div className="glass p-4 border-white/5 shadow-2xl bg-white/[0.02]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
          <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Diagnostic Feed</span>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
        <div className="space-y-2 font-mono">
          {logs.map((log, i) => (
            <div key={i} className={`text-[10px] flex items-start gap-2 transition-all duration-300 ${
              i === logs.length - 1 ? 'text-primary' : 'text-white/10'
            }`}>
              <span className="opacity-20 shrink-0">›</span>
              <span className="break-words leading-tight">{log}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-[10px] text-white/10 animate-pulse italic">Awaiting response…</p>
          )}
        </div>
      </div>
    </div>
  );
}
