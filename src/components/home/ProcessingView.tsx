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
      Promise.resolve().then(() => setLogs(prev => [...prev, statusMessage].slice(-6)));
    }
  }, [statusMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const progressPercent = Math.min(100, Math.max(5, ((currentStepIndex + 1) / steps.length) * 100));

  return (
    <div className="py-12 space-y-12 animate-fade">
      {/* Progress Pulse */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-white/40">
          <span>{steps[currentStepIndex]?.label || 'Initializing'}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="pulse-bar relative">
          <div 
            className="pulse-inner relative" 
            style={{ width: `${progressPercent}%` }}
          >
            <div className="pulse-glow" />
          </div>
        </div>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-4xl font-extrabold tracking-tight gradient-text">
          {statusMessage || 'Preparing Your Sermon Suite…'}
        </h2>
        <p className="text-white/40 font-medium">
          Our AI is analyzing every moment of your sermon. This usually takes 2–5 minutes.
        </p>
      </div>

      {/* Terminal Feed */}
      <div className="max-w-xl mx-auto">
        <div className="glass p-6 border-white/5 shadow-2xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
            </div>
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-2">Engine Output</span>
          </div>
          <div
            ref={scrollRef}
            className="h-40 overflow-y-auto space-y-3 scrollbar-hide font-mono"
          >
            {logs.length === 0 && (
              <p className="text-xs text-white/20 italic animate-pulse">Establishing connection to neural engine…</p>
            )}
            {logs.map((log, i) => (
              <div key={i} className={`text-[11px] flex items-start gap-3 transition-all duration-500 ${
                i === logs.length - 1 ? 'text-indigo-400' : 'text-white/20'
              }`}>
                <span className="opacity-30 shrink-0 select-none">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                <span className="break-words leading-relaxed">{log}{i === logs.length - 1 ? '…' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
