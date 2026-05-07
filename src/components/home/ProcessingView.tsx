'use client';

import ProgressSteps from '@/components/ProgressSteps';
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

  return (
    <div className="py-8 space-y-10 animate-fade-in">
      <ProgressSteps steps={steps} currentStepIndex={currentStepIndex} />

      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-stone-800">
          {statusMessage || 'Initializing…'}
        </h2>
        <p className="text-sm text-stone-400 font-medium">
          This usually takes 2–5 minutes
        </p>
      </div>

      {/* Live log feed */}
      <div className="max-w-lg mx-auto">
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-widest">Live Feed</span>
          </div>
          <div
            ref={scrollRef}
            className="h-28 overflow-y-auto space-y-2 scrollbar-hide"
          >
            {logs.length === 0 && (
              <p className="text-xs text-stone-400 italic font-mono">Waiting for engine…</p>
            )}
            {logs.map((log, i) => (
              <div key={i} className={`text-xs font-mono flex items-start gap-2 ${
                i === logs.length - 1 ? 'text-indigo-600' : 'text-stone-400'
              }`}>
                <span className="opacity-50 shrink-0">{new Date().toLocaleTimeString([], { hour12: false })}</span>
                <span className="break-words">{log}{i === logs.length - 1 ? '…' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
