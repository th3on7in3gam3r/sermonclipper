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
    <div className="w-full max-w-3xl mx-auto py-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex || step.status === 'completed';

          return (
            <div key={step.id} className="flex flex-col items-center text-center min-w-0">
              <div 
                className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                    : isActive 
                      ? 'bg-violet-600 border-violet-600 text-white animate-pulse' 
                      : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                }`}>
                {isCompleted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="font-bold text-sm">{index + 1}</span>
                )}
              </div>
              <span className={`mt-2 text-sm font-medium ${isActive ? 'text-violet-400' : isCompleted ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
