'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import StudioHelpShell from '@/components/help/StudioHelpShell';

type NetworkChurch = {
  clerkId: string;
  email?: string;
  lastActiveAt?: string;
  usageCount: number;
  plan: string;
};

type NetworkStats = {
  totalClips: number;
  totalExports: number;
  churches: NetworkChurch[];
};

export default function NetworkDashboardPage() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    fetch('/api/network/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d.stats) setStats(d.stats);
      })
      .catch(() => {});
  }, []);

  const pushAnnouncement = async () => {
    const res = await fetch('/api/network/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: announcement }),
    });
    if (res.ok) {
      toast.success('Announcement sent to all churches in your network');
      setAnnouncement('');
    } else {
      toast.error('Could not send announcement');
    }
  };

  return (
    <StudioHelpShell>
      <main className="vesper-mesh-bg-container" style={{ minHeight: '100vh' }}>
        <div className="vesper-mesh-bg" />
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '120px 24px 80px', position: 'relative', zIndex: 1 }}>
          <Link href="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
            ← Studio
          </Link>
          <h1 style={{ fontSize: 36, fontWeight: 900, margin: '16px 0 8px' }}>Network Admin</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
            Aggregate stats and announcements across all churches in your network. Contact sales for Network billing.
          </p>

          {stats && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
                <div className="glass-card premium-border" style={{ padding: 20 }}>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>Churches</p>
                  <p style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 900 }}>{stats.churches.length}</p>
                </div>
                <div className="glass-card premium-border" style={{ padding: 20 }}>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>Clips this month</p>
                  <p style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 900 }}>{stats.totalClips}</p>
                </div>
                <div className="glass-card premium-border" style={{ padding: 20 }}>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>Exports</p>
                  <p style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 900 }}>{stats.totalExports}</p>
                </div>
              </div>

              <div className="glass-card premium-border" style={{ padding: 24, marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Churches in network</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {stats.churches.map((c) => (
                    <div key={c.clerkId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
                      <span>{c.email || c.clerkId}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{c.usageCount} clips · {c.plan}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="glass-card premium-border" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Network announcement</h2>
            <textarea
              className="vesper-input"
              rows={3}
              placeholder="Message to all church accounts…"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
            />
            <button type="button" className="vesper-btn vesper-btn-primary" style={{ marginTop: 12 }} onClick={pushAnnouncement}>
              Push to all churches
            </button>
          </div>
        </div>
      </main>
    </StudioHelpShell>
  );
}
