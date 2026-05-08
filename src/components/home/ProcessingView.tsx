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
      setLogs(prev => {
        const last = prev[prev.length - 1];
        if (last === statusMessage && !statusMessage.startsWith('[Raw]')) return prev;
        return [...prev, statusMessage].slice(-12);
      });
    }
  }, [statusMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const progressPercent = Math.min(100, Math.max(5, ((currentStepIndex + 1) / steps.length) * 100));

  return (
    <div className="animate-fade w-full max-w-xl mx-auto flex flex-col items-center">
      <div className="w-full space-y-12">
        {/* Titan Header - Matches Home Page Aesthetics */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Neural Stream Active</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none text-white">
            Processing <span className="gradient-text">Suite</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20">Establishing Media Connection</p>
        </div>

        {/* Progress System */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              Step: {steps[currentStepIndex]?.label || 'Initialization'}
            </span>
            <span className="text-2xl font-black text-white/5 tracking-tighter">{Math.round(progressPercent)}%</span>
          </div>
          <div className="pulse-bar-container">
            <div className="pulse-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* High-End Diagnostic Feed */}
        <div className="glass-card !p-0 border-white/5 overflow-hidden shadow-2xl bg-[#0d0d0d]">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/30" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/30" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30" />
              </div>
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Diagnostic Console</span>
            </div>
            <div className="text-[8px] font-black text-white/10 uppercase tracking-widest">v2.6 Secure</div>
          </div>
          
          <div 
            ref={scrollRef}
            className="p-6 h-60 overflow-y-auto font-mono scrollbar-hide space-y-3"
          >
            {logs.map((log, i) => {
              const isRaw = log.startsWith('[Raw]');
              const isError = /error|failed|blocked|demanded/i.test(log);
              const isWarning = /warning|trying|attempting/i.test(log);
              
              const cleanLog = log.replace('[Raw]', '').trim();
              
              let textColor = 'text-white/20';
              if (i === logs.length - 1) textColor = 'text-primary';
              if (isRaw) textColor = 'text-amber-500/60';
              if (isWarning) textColor = 'text-amber-400/80';
              if (isError) textColor = 'text-red-400 font-bold';

              return (
                <div key={i} className={`text-[11px] flex items-start gap-3 transition-all duration-300 ${textColor}`}>
                  <span className="opacity-10 shrink-0 select-none">[{i+1}]</span>
                  <span className="break-words leading-relaxed">{cleanLog}</span>
                </div>
              );
            })}
            {logs.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <p className="text-[9px] text-white/5 uppercase tracking-[0.5em] animate-pulse">Awaiting Neural Link</p>
              </div>
            )}
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="pt-8 text-center">
          <p className="text-[8px] font-black tracking-[0.6em] text-white/5 uppercase select-none">Professional Media Suite · Ironclad Build</p>
        </div>
      </div>
    </div>
  );
}
