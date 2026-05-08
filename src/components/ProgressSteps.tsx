'use client';

import React from 'react';

type StepStatus = 'pending' | 'loading' | 'completed' | 'error';

interface Step {
  id: string;
  label: string;
  status?: StepStatus;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStepIndex: number;
}

export default function ProgressSteps({ steps, currentStepIndex }: ProgressStepsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex || step.status === 'completed';
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-3 min-w-0 group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : isActive
                      ? 'bg-primary border-primary/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110'
                      : 'bg-white/5 border-white/10 text-white/20'
                }`}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                  ) : (
                    <span className="text-[10px] font-bold">{index + 1}</span>
                  )}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-colors duration-500 ${
                  isActive ? 'text-primary' : isCompleted ? 'text-emerald-500' : 'text-white/20'
                }`}>
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div className={`flex-1 h-[1px] mx-4 mb-8 transition-all duration-1000 ${
                  isCompleted ? 'bg-emerald-500/50' : isActive ? 'bg-primary/20' : 'bg-white/5'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
