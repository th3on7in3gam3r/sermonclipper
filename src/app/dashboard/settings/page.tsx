'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube Shorts' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
];

export default function AccountSettingsPage() {
  const [connections, setConnections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/social/connections')
      .then((r) => r.json())
      .then((d) => setConnections(d.connections || {}))
      .catch(() => {});
  }, []);

  const disconnect = async (platform: string) => {
    const res = await fetch(`/api/social/connections?platform=${platform}`, { method: 'DELETE' });
    if (res.ok) {
      setConnections((prev) => ({ ...prev, [platform]: false }));
      toast.success(`${platform} disconnected`);
    }
  };

  const connect = async (platform: string) => {
    const res = await fetch(`/api/social/connect?platform=${platform}`);
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else toast.error(data.error || 'Connect via Clerk Google sign-in or platform API setup.');
  };

  return (
    <main className="vesper-mesh-bg-container" style={{ minHeight: '100vh' }}>
      <div className="vesper-mesh-bg" />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '120px 24px 80px', position: 'relative', zIndex: 1 }}>
        <Link href="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
          ← Back to Studio
        </Link>
        <h1 style={{ fontSize: '36px', fontWeight: 900, margin: '16px 0 8px' }}>Account settings</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Connected social accounts for Social Stewardship direct publishing.</p>

        <div className="glass-card premium-border" style={{ padding: '24px' }}>
          {PLATFORMS.map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <p style={{ fontWeight: 800 }}>{p.label}</p>
                <p style={{ fontSize: '13px', color: connections[p.id] ? '#10B981' : 'var(--text-muted)' }}>
                  {connections[p.id] ? 'Connected' : 'Not connected'}
                </p>
              </div>
              {connections[p.id] ? (
                <button type="button" className="vesper-btn-outline" onClick={() => disconnect(p.id)}>
                  Disconnect
                </button>
              ) : (
                <button type="button" className="vesper-btn vesper-btn-primary" onClick={() => connect(p.id)}>
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
