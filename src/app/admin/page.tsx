'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Metrics = {
  users: {
    total: number;
    signups30: number;
    signups7: number;
    activeUsers: number;
    planCounts: Record<string, number>;
  };
  revenue: { mrr: number };
  usage: {
    chartData: { date: string; clips: number }[];
    uploadCount: number;
    youtubeCount: number;
    avgClipsPerUser: number;
  };
  nps?: {
    average: number;
    responses: number;
    distribution: { score: number; count: number }[];
    feedback: { score: number; feedback?: string }[];
  };
};

type AdminUser = {
  clerkId: string;
  email: string;
  plan: string;
  joined: string;
  lastActive: string;
  usageCount: number;
};

type AbTestStats = {
  testName: string;
  variants: {
    variant: string;
    impressions: number;
    clicks: number;
    signups: number;
    conversionRate: number;
  }[];
  significant: boolean;
  significanceNote: string;
};

export default function AdminPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [abTest, setAbTest] = useState<AbTestStats | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [mRes, uRes, abRes] = await Promise.all([
      fetch('/api/admin/metrics'),
      fetch(`/api/admin/users?q=${encodeURIComponent(search)}`),
      fetch('/api/admin/ab-test'),
    ]);
    if (!mRes.ok || !uRes.ok) {
      setError('Unauthorized or failed to load admin data.');
      return;
    }
    setMetrics(await mRes.json());
    setUsers((await uRes.json()).users);
    if (abRes.ok) setAbTest((await abRes.json()).heroCta);
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  const setPlan = async (clerkId: string, plan: string) => {
    await fetch('/api/admin/metrics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId, plan }),
    });
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

  if (!metrics) {
    return (
      <main className="admin-page">
        <p>Loading admin metrics…</p>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1>Vesper Admin</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/admin/flags">Feature Flags</Link>
          <Link href="/dashboard">← Dashboard</Link>
        </div>
      </header>

      <section className="admin-kpis">
        <div className="admin-kpi glass-card">
          <span>Total users</span>
          <strong>{metrics.users.total}</strong>
        </div>
        <div className="admin-kpi glass-card">
          <span>Signups (30d)</span>
          <strong>{metrics.users.signups30}</strong>
        </div>
        <div className="admin-kpi glass-card">
          <span>Active (30d)</span>
          <strong>{metrics.users.activeUsers}</strong>
        </div>
        <div className="admin-kpi glass-card">
          <span>MRR</span>
          <strong>${metrics.revenue.mrr}</strong>
        </div>
      </section>

      <section className="admin-chart glass-card">
        <h2>Clips per day (30d)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={metrics.usage.chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} />
            <YAxis tick={{ fill: '#888', fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="clips" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {metrics.nps && (
        <section className="admin-chart glass-card">
          <h2>NPS ({metrics.nps.responses} responses)</h2>
          <p style={{ fontSize: '32px', fontWeight: 900, margin: '8px 0 24px' }}>
            Average score: {metrics.nps.average}/10
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={metrics.nps.distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="score" tick={{ fill: '#888', fontSize: 10 }} />
              <YAxis tick={{ fill: '#888', fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {metrics.nps.feedback.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Written feedback</h3>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {metrics.nps.feedback.slice(0, 20).map((f, i) => (
                  <li key={i} style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    <strong style={{ color: '#fff' }}>{f.score}/10</strong> — {f.feedback}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {abTest && (
        <section className="admin-chart glass-card">
          <h2>Hero CTA A/B Test</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{abTest.significanceNote}</p>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Variant</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>Signups</th>
                <th>Conv. rate</th>
              </tr>
            </thead>
            <tbody>
              {abTest.variants.map((v) => (
                <tr key={v.variant}>
                  <td>{v.variant}</td>
                  <td>{v.impressions}</td>
                  <td>{v.clicks}</td>
                  <td>{v.signups}</td>
                  <td>{v.conversionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="admin-users glass-card">
        <h2>Users</h2>
        <input
          type="search"
          placeholder="Search email or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search"
        />
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Plan</th>
                <th>Joined</th>
                <th>Clips</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.clerkId}>
                  <td>{u.email || u.clerkId}</td>
                  <td>{u.plan}</td>
                  <td>{new Date(u.joined).toLocaleDateString()}</td>
                  <td>{u.usageCount}</td>
                  <td>
                    <select
                      value={u.plan}
                      onChange={(e) => setPlan(u.clerkId, e.target.value)}
                      aria-label={`Plan for ${u.email}`}
                    >
                      <option value="free">Free</option>
                      <option value="creator">Creator</option>
                      <option value="church_pro">Church Pro</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
