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
        return [...prev, statusMessage].slice(-10);
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
    <div className="w-full max-w-xl animate-platinum flex flex-col items-center">
      <div className="w-full space-y-12">
        {/* Platinum Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-accent">Neural Analysis in Progress</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase leading-none text-white">
            Processing <span className="gradient-text">Neural Stream</span>
          </h2>
        </div>

        {/* Platinum Progress Bar */}
        <div className="space-y-6">
          <div className="progress-container gold-glow">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex justify-between items-center px-2">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
              {steps[currentStepIndex]?.label || 'Resolving'}
            </span>
            <span className="text-2xl font-black text-white/5 tracking-tighter">{Math.round(progressPercent)}%</span>
          </div>
        </div>

        {/* Platinum Console */}
        <div className="platinum-card !p-0 border-white/5 overflow-hidden shadow-2xl bg-black/40">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Diagnostic Live Feed</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-primary/40" />
              <div className="w-1 h-1 rounded-full bg-accent/40" />
            </div>
          </div>
          
          <div 
            ref={scrollRef}
            className="p-6 h-56 overflow-y-auto font-mono scrollbar-hide space-y-2.5"
          >
            {logs.map((log, i) => {
              const isRaw = log.startsWith('[Raw]');
              const isError = /error|failed|blocked/i.test(log);
              const isWarning = /warning|trying|attempting/i.test(log);
              
              const cleanLog = log.replace('[Raw]', '').trim();
              
              let textColor = 'text-white/10';
              if (i === logs.length - 1) textColor = 'text-accent';
              if (isRaw) textColor = 'text-white/5';
              if (isWarning) textColor = 'text-primary/80';
              if (isError) textColor = 'text-red-400 font-bold';

              return (
                <div key={i} className={`text-[10px] flex items-start gap-3 transition-all duration-300 ${textColor}`}>
                  <span className="opacity-10 shrink-0">›</span>
                  <span className="break-words leading-relaxed">{cleanLog}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Branding Footer */}
        <div className="text-center opacity-5">
          <p className="text-[8px] font-black tracking-[0.8em] uppercase">Professional Suite · Ironclad Build 2.7</p>
        </div>
      </div>
    </div>
  );
}
