'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function BetaProgramPanel() {
  const [enabled, setEnabled] = useState(false);
  const [churchType, setChurchType] = useState('');
  const [usageFrequency, setUsageFrequency] = useState('');
  const [changelogOptIn, setChangelogOptIn] = useState(false);

  useEffect(() => {
    fetch('/api/user/beta')
      .then((r) => r.json())
      .then((d) => {
        setEnabled(d.isBetaTester ?? false);
        setChurchType(d.churchType || '');
        setUsageFrequency(d.usageFrequency || '');
        setChangelogOptIn(d.changelogOptIn ?? false);
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    const res = await fetch('/api/user/beta', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isBetaTester: enabled,
        churchType,
        usageFrequency,
        changelogOptIn,
      }),
    });
    if (res.ok) toast.success('Beta preferences saved');
    else toast.error('Could not save');
  };

  return (
    <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '8px' }}>Join the Beta</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
        Get early access to new features and help shape Vesper before general release.
      </p>

      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', cursor: 'pointer' }}>
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <span>I want early access to new features</span>
      </label>

      <label style={{ display: 'block', marginBottom: '16px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>What kind of church do you serve?</span>
        <input
          value={churchType}
          onChange={(e) => setChurchType(e.target.value)}
          placeholder="e.g. Multisite, rural, church plant…"
          style={{
            width: '100%',
            marginTop: '8px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.03)',
            color: '#fff',
          }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: '16px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>How often do you use Vesper?</span>
        <select
          value={usageFrequency}
          onChange={(e) => setUsageFrequency(e.target.value)}
          style={{
            width: '100%',
            marginTop: '8px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: '#0a0a0f',
            color: '#fff',
          }}
        >
          <option value="">Select…</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="occasionally">Occasionally</option>
        </select>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <input type="checkbox" checked={changelogOptIn} onChange={(e) => setChangelogOptIn(e.target.checked)} />
        <span style={{ fontSize: '14px' }}>List me as a Community Beta Tester on major releases</span>
      </label>

      <button type="button" onClick={() => void save()} className="vesper-btn vesper-btn-primary">
        Save beta preferences
      </button>
    </div>
  );
}
