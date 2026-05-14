'use client';

import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';

interface ProcessingViewProps {
  steps: { id: string; label: string }[];
  currentStepIndex: number;
  statusMessage: string;
}

export default function ProcessingView({ steps, currentStepIndex, statusMessage }: ProcessingViewProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Capture logs
  useEffect(() => {
    if (statusMessage) {
      Promise.resolve().then(() => setLogs(prev => {
        if (prev[prev.length - 1] === statusMessage && !statusMessage.startsWith('[Raw]')) return prev;
        return [...prev, statusMessage].slice(-10);
      }));
    }
  }, [statusMessage]);

  // Auto-scroll log feed
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Notification permission state
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Promise.resolve().then(() => setNotificationPermission(Notification.permission));
    }
  }, []);

  const progressPercent = Math.min(100, Math.max(5, ((currentStepIndex + 1) / steps.length) * 100));

  // Notify when complete
  useEffect(() => {
    if (progressPercent >= 100 && notificationPermission === 'granted') {
      new Notification('Vesper: Harvest Complete!', {
        body: 'Your sermon has been successfully processed and your cinematic clips are ready.',
        icon: '/favicon.ico'
      });
    }
  }, [progressPercent, notificationPermission]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast.success('We will notify you when your harvest is ready! 🔔');
      }
    }
  };

  return (
    <div style={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.3em', marginBottom: '12px' }}>NEURAL ENGINE ACTIVE</div>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '12px' }}>Processing Your Sermon</h2>
        <p style={{ color: '#A1A1AA', fontSize: '15px', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto' }}>
          This usually takes 4–10 minutes depending on length. You can close this tab — we&apos;ll notify you when it&apos;s done.
        </p>
      </div>

      {/* Progress Card */}
      <div style={{ width: '100%', padding: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px' }}>

        {/* Status header + percent */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.05em', textAlign: 'left', flex: 1, paddingRight: '12px' }}>
            {statusMessage.startsWith('[Raw]') ? 'Deep Resolution…' : (statusMessage || 'Analyzing…')}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 900, color: '#8B5CF6', fontFamily: 'monospace' }}>
            {Math.round(progressPercent)}%
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden', marginBottom: '28px' }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, #8B5CF6, #D8B4FE)',
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 12px rgba(139, 92, 246, 0.5)',
          }} />
        </div>

        {/* Step list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          {steps.map((step, i) => {
            const isDone = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            const isPending = i > currentStepIndex;
            return (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 900,
                  background: isDone ? '#10B981' : isCurrent ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                  border: isDone ? 'none' : isCurrent ? '1px solid #8B5CF6' : '1px solid rgba(255,255,255,0.08)',
                  color: isDone ? '#fff' : isCurrent ? '#8B5CF6' : '#52525B',
                  animation: isCurrent ? 'pulse 1.5s ease-in-out infinite' : 'none',
                }}>
                  {isDone ? '✓' : isCurrent ? '◐' : '○'}
                </div>
                <span style={{
                  fontSize: '14px', fontWeight: 600,
                  color: isDone ? '#10B981' : isCurrent ? '#fff' : '#52525B',
                  letterSpacing: '-0.01em',
                }}>
                  {step.label}
                  {isCurrent && <span style={{ color: '#8B5CF6', marginLeft: '6px', fontWeight: 700 }}>· in progress</span>}
                  {isPending && <span style={{ color: '#3F3F46', marginLeft: '6px' }}>· pending</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {notificationPermission !== 'granted' && (
          <button
            onClick={requestNotificationPermission}
            style={{
              padding: '10px 20px', borderRadius: '10px',
              background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
              color: '#C4B5FD', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            🔔 NOTIFY ME WHEN DONE
          </button>
        )}
        <button
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          style={{
            padding: '10px 20px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#A1A1AA', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          {showDiagnostics ? '✕ HIDE LOG' : '📋 SHOW LOG'}
        </button>
      </div>

      {/* Log feed */}
      {showDiagnostics && (
        <div
          ref={scrollRef}
          style={{
            width: '100%', padding: '16px', background: '#000',
            border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px',
            textAlign: 'left', maxHeight: '180px', overflowY: 'auto',
            fontFamily: 'monospace', fontSize: '11px', lineHeight: 1.6,
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: '#52525B', fontStyle: 'italic' }}>Waiting for neural handshake…</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px', color: i === logs.length - 1 ? '#C4B5FD' : '#71717A' }}>
                <span style={{ color: '#52525B', flexShrink: 0 }}>[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                <span>{log}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer hint */}
      <p style={{ color: '#3F3F46', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3em', marginTop: '8px' }}>
        Please keep this window open
      </p>
    </div>
  );
}
