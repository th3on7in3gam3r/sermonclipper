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

  const [showDiagnostics, setShowDiagnostics] = useState(false);

  return (
    <div className="animate-up" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
      <h2 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '8px' }}>Processing Your Sermon</h2>
      <p style={{ color: '#A1A1AA', fontSize: '18px', fontWeight: 300, marginBottom: '48px' }}>This usually takes 4–10 minutes depending on length</p>

      {/* Progress Card */}
      <div className="platinum-card" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
        <div className="progress-header">
          <span style={{ opacity: 0.5 }}>{statusMessage.startsWith('[Raw]') ? 'Deep Resolution...' : (statusMessage || 'Analyzing...')}</span>
          <span style={{ color: '#8B5CF6' }}>{Math.round(progressPercent)}%</span>
        </div>
        
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progressPercent}%`, boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)' }} 
          />
        </div>

        <div className="status-list">
          {steps.map((step, i) => {
            const isDone = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            
            return (
              <div key={step.id} className={`status-item ${isDone ? 'done' : isCurrent ? 'active' : ''}`}>
                <div className="status-dot">
                  {isDone ? '✓' : isCurrent ? '⟳' : '•'}
                </div>
                <span style={{ letterSpacing: '-0.01em' }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Neural Diagnostics Toggle */}
      <div style={{ marginTop: '32px' }}>
        <button 
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '99px', padding: '8px 16px', color: '#52525B', fontSize: '10px', fontWeight: 900, letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.3s' }}
        >
          {showDiagnostics ? 'HIDE NEURAL LOG' : 'SHOW NEURAL LOG'}
        </button>

        {showDiagnostics && (
          <div 
            ref={scrollRef}
            style={{ 
              marginTop: '16px', padding: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', 
              borderRadius: '16px', textAlign: 'left', maxHeight: '200px', overflowY: 'auto', 
              fontFamily: 'monospace', fontSize: '11px', color: '#A1A1AA', lineHeight: 1.5 
            }}
          >
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '8px', borderLeft: '2px solid #8B5CF6', paddingLeft: '12px' }}>
                <span style={{ color: '#8B5CF6' }}>[{new Date().toLocaleTimeString()}]</span> {log}
              </div>
            ))}
            {logs.length === 0 && <div style={{ opacity: 0.5 }}>Waiting for neural handshake...</div>}
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', color: '#555', marginTop: '40px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em' }}>
        Please keep this window open
      </p>
    </div>
  );
}
