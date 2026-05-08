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
        // Prevent duplicate consecutive logs unless they are raw engine output
        if (prev[prev.length - 1] === statusMessage && !statusMessage.startsWith('[Raw]')) return prev;
        return [...prev, statusMessage].slice(-20);
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
    <div className="animate-fade w-full max-w-xl mx-auto space-y-8">
      {/* Platinum Header */}
      <div className="space-y-4">
        <div className="flex items-end justify-between border-b border-white/5 pb-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Neural Stream Active</p>
            <h2 className="text-2xl font-bold tracking-tight text-white leading-none">
              {statusMessage.startsWith('[Raw]') ? 'Deep Resolution...' : (statusMessage || 'Initializing...')}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-white/5">{Math.round(progressPercent)}%</span>
          </div>
        </div>
        
        <div className="h-1 w-full bg-white/[0.03] rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-1000 ease-in-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Zero-Overlap Console */}
      <div className="glass-card !p-0 overflow-hidden border-white/5 shadow-2xl bg-[#0d0d0d]">
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Diagnostic Telemetry</span>
          </div>
          <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">SermonClipper 2.5</span>
        </div>
        
        <div 
          ref={scrollRef}
          className="p-5 h-72 overflow-y-auto font-mono scrollbar-hide space-y-2.5"
        >
          {logs.map((log, i) => {
            const isRaw = log.startsWith('[Raw]');
            const isError = log.toLowerCase().includes('error') || log.toLowerCase().includes('failed') || log.toLowerCase().includes('bot');
            const isWarning = log.toLowerCase().includes('warning') || log.toLowerCase().includes('missing');
            
            const cleanLog = log.replace('[Raw]', '').trim();
            
            let textColor = 'text-white/20';
            if (i === logs.length - 1) textColor = 'text-primary';
            if (isRaw) textColor = 'text-amber-500/80';
            if (isWarning) textColor = 'text-amber-400 font-bold';
            if (isError) textColor = 'text-red-400 font-bold';

            return (
              <div key={i} className={`text-[11px] flex items-start gap-3 transition-all duration-300 ${textColor}`}>
                <span className="opacity-30 shrink-0 select-none">[{i+1}]</span>
                <span className="break-words leading-relaxed">{cleanLog}</span>
              </div>
            );
          })}
          {logs.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <p className="text-[10px] text-white/5 uppercase tracking-[0.5em] animate-pulse">Establishing Handshake</p>
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <p className="text-[9px] font-bold text-white/5 uppercase tracking-[0.6em]">Professional Suite · Ironclad Build</p>
      </div>
    </div>
  );
}
