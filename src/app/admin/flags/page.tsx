'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Flag = {
  flagName: string;
  enabled: boolean;
  rolloutPercentage: number;
};

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/flags');
    if (!res.ok) {
      setError('Unauthorized');
      return;
    }
    const data = await res.json();
    setFlags(data.flags || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateFlag = async (flagName: string, patch: Partial<Flag>) => {
    await fetch('/api/admin/flags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagName, ...patch }),
    });
    void load();
  };

  const createFlag = async () => {
    if (!newName.trim()) return;
    await fetch('/api/admin/flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagName: newName.trim(), enabled: false, rolloutPercentage: 0 }),
    });
    setNewName('');
    void load();
  };

  if (error) {
    return (
      <main className="admin-page">
        <p>{error}</p>
        <Link href="/dashboard">← Dashboard</Link>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1>Feature Flags</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/admin">Metrics</Link>
          <Link href="/dashboard">← Dashboard</Link>
        </div>
      </header>

      <section className="admin-users glass-card">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            className="admin-search"
            placeholder="new_flag_name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="button" className="vesper-btn-outline" onClick={createFlag}>
            Add flag
          </button>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Flag</th>
              <th>Enabled</th>
              <th>Rollout %</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((f) => (
              <tr key={f.flagName}>
                <td>
                  <code>{f.flagName}</code>
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={f.enabled}
                    onChange={(e) => updateFlag(f.flagName, { enabled: e.target.checked })}
                  />
                </td>
                <td>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={f.rolloutPercentage}
                    onChange={(e) => updateFlag(f.flagName, { rolloutPercentage: Number(e.target.value) })}
                  />
                  <span>{f.rolloutPercentage}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
