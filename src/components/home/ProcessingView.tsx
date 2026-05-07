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
      Promise.resolve().then(() => setLogs(prev => [...prev, statusMessage].slice(-5)));
    }
  }, [statusMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="py-12 md:py-20 space-y-16 animate-fade-in">
      <div className="space-y-10">
        <ProgressSteps steps={steps} currentStepIndex={currentStepIndex} />
        
        <div className="text-center space-y-6">
          <div className="relative inline-block">
             <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter animate-pulse">
              {statusMessage || 'Initializing Suite...'}
            </h2>
            <div className="absolute -bottom-2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50" />
          </div>
          <p className="text-zinc-500 text-sm font-black uppercase tracking-[0.3em] animate-bounce">
            Processing Engine Online
          </p>
        </div>
      </div>

      {/* Live Producer Feed */}
      <div className="max-w-xl mx-auto">
        <div className="bg-zinc-950/80 rounded-2xl border border-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-white/5 pb-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-sm font-black text-emerald-500 uppercase tracking-widest">Live Producer Feed</span>
            </div>
            <span className="text-sm font-mono text-zinc-600">STDOUT: ACTIVE</span>
          </div>
          
          <div 
            ref={scrollRef}
            className="h-32 overflow-y-auto space-y-3 font-mono scrollbar-hide"
          >
            {logs.map((log, i) => (
              <div key={i} className={`text-sm flex flex-col gap-2 ${i === logs.length - 1 ? 'text-violet-400' : 'text-zinc-600'}`}>
                <span className="opacity-30">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                <span className="flex-grow break-words">{log}...</span>
                {i === logs.length - 1 && <span className="animate-pulse">_</span>}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-sm text-zinc-800 italic">Waiting for engine handshake...</div>
            )}
          </div>
        </div>
        
        <p className="text-center mt-6 text-sm text-zinc-600 font-bold uppercase tracking-widest opacity-50">
          This process usually takes 2-5 minutes depending on sermon length
        </p>
      </div>
    </div>
  );
}
