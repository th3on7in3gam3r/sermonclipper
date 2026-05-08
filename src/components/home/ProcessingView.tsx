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
        return [...prev, statusMessage].slice(-15);
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
      {/* Executive Progress Header */}
      <div className="space-y-4">
        <div className="flex items-end justify-between border-b border-white/5 pb-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">System Status</p>
            <h2 className="text-2xl font-bold tracking-tight text-white leading-none">
              {statusMessage.startsWith('[Raw]') ? 'Resolving Neural Stream...' : (statusMessage || 'Initializing...')}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-white/10">{Math.round(progressPercent)}%</span>
          </div>
        </div>
        
        {/* Sleek Progress Bar */}
        <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-in-out relative" 
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Professional Telemetry Console */}
      <div className="glass-card !p-0 overflow-hidden border-white/5 shadow-2xl bg-black/40">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/20" />
              <div className="w-2 h-2 rounded-full bg-amber-500/20" />
              <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
            </div>
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] border-l border-white/10 pl-3">Live Telemetry</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest">Active</span>
          </div>
        </div>
        
        <div 
          ref={scrollRef}
          className="p-6 h-64 overflow-y-auto font-mono scrollbar-hide space-y-3"
        >
          {logs.map((log, i) => {
            const isRaw = log.startsWith('[Raw]');
            const cleanLog = isRaw ? log.replace('[Raw]', '').trim() : log;
            return (
              <div key={i} className={`text-[11px] flex items-start gap-3 transition-all duration-300 ${
                i === logs.length - 1 ? (isRaw ? 'text-amber-400' : 'text-indigo-400') : 'text-white/10'
              }`}>
                <span className="opacity-20 shrink-0 select-none">›</span>
                <span className="break-words leading-relaxed">{cleanLog}</span>
              </div>
            );
          })}
          {logs.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <p className="text-[10px] text-white/5 uppercase tracking-[0.5em] animate-pulse">Awaiting Neural Handshake</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="flex items-center justify-between opacity-10 px-2">
        <p className="text-[8px] font-black tracking-[0.4em] uppercase">SermonClipper Engine 2.4</p>
        <p className="text-[8px] font-black tracking-[0.4em] uppercase">Professional Suite</p>
      </div>
    </div>
  );
}
