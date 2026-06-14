'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

type ApiKeyRow = {
  id: string;
  name: string;
  prefix: string;
  last4: string;
  mode: string;
  createdAt: string;
};

export default function DeveloperSettingsPanel() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [newKeyName, setNewKeyName] = useState('Production');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    fetch('/api/developer/keys')
      .then((r) => r.json())
      .then((d) => setKeys(d.keys || []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const createKey = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/developer/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRevealedKey(data.key);
      toast.success('API key created — copy it now');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create key');
    } finally {
      setLoading(false);
    }
  };

  const revoke = async (id: string) => {
    const res = await fetch(`/api/developer/keys?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Key revoked');
      load();
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 900 }}>Developer API</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Generate keys for programmatic access. Keys are prefixed <code>vsp_live_</code> or <code>vsp_test_</code>.
          </p>
        </div>
        <Link href="/developers" className="vesper-btn-outline" style={{ padding: '8px 16px', fontSize: '12px' }}>
          View docs →
        </Link>
      </div>

      {revealedKey && (
        <div
          style={{
            background: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
          }}
        >
          <p style={{ fontSize: '12px', fontWeight: 800, marginBottom: '8px' }}>Copy your key — shown once</p>
          <code style={{ wordBreak: 'break-all', fontSize: '13px' }}>{revealedKey}</code>
          <button
            type="button"
            className="vesper-btn-outline"
            style={{ marginTop: '12px', fontSize: '12px' }}
            onClick={() => {
              navigator.clipboard.writeText(revealedKey);
              toast.success('Copied');
            }}
          >
            Copy key
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Key name"
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.03)',
            color: '#fff',
          }}
        />
        <button type="button" onClick={() => void createKey()} disabled={loading} className="vesper-btn vesper-btn-primary">
          {loading ? 'Creating…' : 'Generate key'}
        </button>
      </div>

      {keys.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No API keys yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {keys.map((k) => (
            <li
              key={k.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{k.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {k.prefix}••••{k.last4} · {k.mode}
                </div>
              </div>
              <button type="button" className="vesper-btn-outline" style={{ fontSize: '11px' }} onClick={() => void revoke(k.id)}>
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
