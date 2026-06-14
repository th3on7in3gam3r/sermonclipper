'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type SecretRow = {
  id: string;
  label: string;
  rotationDays: number;
  overdue: boolean;
  daysUntilRotation: number | null;
  configured: boolean;
  hasPrevious: boolean;
};

export default function AdminSecretsHealthPage() {
  const [secrets, setSecrets] = useState<SecretRow[]>([]);
  const [guidance, setGuidance] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/secrets-health')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setSecrets(d.secrets || []);
          setGuidance(d.guidance || {});
        }
      });
  }, []);

  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 20px', color: '#fff' }}>
      <Link href="/admin" style={{ color: 'var(--primary)' }}>
        ← Admin
      </Link>
      <h1 style={{ fontSize: '32px', fontWeight: 900, margin: '16px 0' }}>Secrets health</h1>

      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {secrets.map((s) => (
          <div key={s.id} className="glass-card" style={{ padding: '14px', borderColor: s.overdue ? '#ef4444' : undefined }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <strong>{s.label}</strong>
              <span style={{ fontSize: '12px', color: s.overdue ? '#ef4444' : 'var(--text-muted)' }}>
                {s.overdue ? 'Overdue' : s.daysUntilRotation != null ? `${s.daysUntilRotation}d until rotation` : 'Set LAST_ROTATED env'}
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              {s.configured ? 'Configured' : 'Not set'} · Rotate every {s.rotationDays}d
              {s.hasPrevious ? ' · Previous secret active (grace)' : ''}
            </p>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>Rotation guidance</h2>
        {Object.entries(guidance).map(([k, v]) => (
          <p key={k} style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 8px' }}>
            {v}
          </p>
        ))}
      </div>
    </main>
  );
}
