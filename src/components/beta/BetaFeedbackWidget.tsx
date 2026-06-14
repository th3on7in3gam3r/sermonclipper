'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function BetaFeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [feature, setFeature] = useState('general');
  const [worksWell, setWorksWell] = useState('');
  const [confusing, setConfusing] = useState('');
  const [missing, setMissing] = useState('');

  const submit = async () => {
    const res = await fetch('/api/user/beta', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feedback: { feature, worksWell, confusing, missing },
      }),
    });
    if (res.ok) {
      toast.success('Thanks for your feedback!');
      setOpen(false);
      setWorksWell('');
      setConfusing('');
      setMissing('');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
          color: '#fff',
          border: 'none',
          borderRadius: '999px',
          padding: '12px 20px',
          fontWeight: 800,
          fontSize: '13px',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(139,92,246,0.4)',
        }}
      >
        Send Feedback
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-card"
            style={{ maxWidth: '480px', width: '100%', padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="vesper-badge badge-violet" style={{ marginBottom: '12px' }}>
              BETA
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '20px' }}>Beta feedback</h3>
            {[
              { label: 'What works well?', value: worksWell, set: setWorksWell },
              { label: "What's confusing?", value: confusing, set: setConfusing },
              { label: "What's missing?", value: missing, set: setMissing },
            ].map((q) => (
              <label key={q.label} style={{ display: 'block', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{q.label}</span>
                <textarea
                  value={q.value}
                  onChange={(e) => q.set(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)',
                    color: '#fff',
                    resize: 'none',
                  }}
                />
              </label>
            ))}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="vesper-btn vesper-btn-primary" onClick={() => void submit()}>
                Submit
              </button>
              <button type="button" className="vesper-btn-outline" onClick={() => setOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
