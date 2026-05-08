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
        // Only add if different from last log or if it's a raw engine log
        if (prev[prev.length - 1] === statusMessage && !statusMessage.startsWith('[Raw]')) return prev;
        return [...prev, statusMessage].slice(-8);
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
    <div className="animate-fade" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      <div className="compact-stack">
        {/* Header Section */}
        <div className="text-center">
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">
            {statusMessage.startsWith('[Raw]') ? 'Deep Diagnostics Running...' : (statusMessage || 'Initializing...')}
          </h2>
          <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">
              Stage: {steps[currentStepIndex]?.label || 'Neural Link'}
            </span>
            <span className="text-[9px] font-black text-white/20">{Math.round(progressPercent)}%</span>
          </div>
          <div className="pulse-bar-container">
            <div className="pulse-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Diagnostic Console */}
        <div className="console-box" style={{ minHeight: '180px', display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
              <span className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-1">Black Box Telemetry</span>
            </div>
            <div className="text-[8px] font-bold text-emerald-500/50 animate-pulse uppercase">Live Feed</div>
          </div>
          
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto space-y-2 scrollbar-hide"
            style={{ maxHeight: '140px' }}
          >
            {logs.map((log, i) => {
              const isRaw = log.startsWith('[Raw]');
              const cleanLog = isRaw ? log.replace('[Raw]', '').trim() : log;
              return (
                <div key={i} className={`text-[10px] font-mono flex items-start gap-2 transition-all ${
                  i === logs.length - 1 ? (isRaw ? 'text-amber-400' : 'text-primary') : 'text-white/10'
                }`}>
                  <span className="opacity-20 shrink-0">[{i}]</span>
                  <span className="break-words leading-tight">{cleanLog}</span>
                </div>
              );
            })}
            {logs.length === 0 && (
              <div className="text-[10px] text-white/5 italic">Awaiting engine handshake...</div>
            )}
          </div>
        </div>

        <p className="text-[8px] text-white/10 text-center uppercase tracking-widest">
          Engine version 2.2 · Distributed Processing Active
        </p>
      </div>
    </div>
  );
}
