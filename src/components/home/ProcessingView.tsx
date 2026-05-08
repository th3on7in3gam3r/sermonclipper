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
        if (prev[prev.length - 1] === statusMessage && !statusMessage.startsWith('[Raw]')) return prev;
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
    <div className="max-w-lg w-full text-center animate-platinum">
      <h2 className="text-4xl font-black tracking-tighter mb-2">Processing Your Sermon</h2>
      <p className="text-[#A1A1AA] mb-12 text-lg font-light tracking-tight">This usually takes 4–10 minutes depending on length</p>

      {/* Progress Card */}
      <div className="bg-[#111114] border border-[#222] rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-4">
          <span className="text-white/40">{statusMessage.startsWith('[Raw]') ? 'Deep Resolution...' : (statusMessage || 'Analyzing...')}</span>
          <span className="text-[#8B5CF6]">{Math.round(progressPercent)}%</span>
        </div>
        
        <div className="h-2.5 bg-[#222] rounded-full overflow-hidden mb-10">
          <div 
            className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#F4B942] transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(139,92,246,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="space-y-5 text-left">
          {steps.map((step, i) => {
            const isDone = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            
            return (
              <div key={step.id} className="flex items-center gap-4 text-sm transition-all duration-500">
                <div className={`flex items-center justify-center w-5 h-5 rounded-full border ${
                  isDone ? 'bg-[#22C55E] border-[#22C55E] text-white' : 
                  isCurrent ? 'border-[#F4B942] text-[#F4B942] animate-pulse' : 
                  'border-white/10 text-white/10'
                }`}>
                  {isDone ? '✓' : isCurrent ? '⟳' : '•'}
                </div>
                <span className={`font-bold tracking-tight ${
                  isDone ? 'text-[#22C55E]' : 
                  isCurrent ? 'text-[#F4B942]' : 
                  'text-[#555]'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Diagnostic Feed (Hidden by default, shown on error or if toggled) */}
      <div className="text-left mt-8 p-4 bg-black/40 rounded-xl border border-white/5 opacity-40">
        <div ref={scrollRef} className="h-16 overflow-y-auto font-mono text-[9px] text-white/20 scrollbar-hide">
          {logs.map((log, i) => (
            <div key={i} className="truncate">› {log}</div>
          ))}
        </div>
      </div>

      <p className="text-[#555] text-[10px] font-black uppercase tracking-[0.4em] mt-8 select-none">
        Please keep this window open
      </p>
    </div>
  );
}
