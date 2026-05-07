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
              <div className="flex flex-col items-center gap-2 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isActive
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                      : 'bg-white border-stone-200 text-stone-400'
                }`}>
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${
                  isActive ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-stone-400'
                }`}>
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div className={`flex-1 h-px mx-2 mb-5 transition-all duration-500 ${
                  isCompleted ? 'bg-emerald-300' : 'bg-stone-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
