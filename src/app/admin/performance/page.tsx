'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Metrics = {
  requestRate: number;
  errorRate: number;
  totalRequests: number;
  slowestEndpoints: { route: string; p95: number; count: number; errorCount: number }[];
  nPlusOneRequests: number;
  queueDepth: number;
  memory: { heapPercent: number; heapUsedMb: number; rssMb: number };
  alerts: {
    clipsP95Slow: boolean;
    errorRateHigh: boolean;
    queueBacklog: boolean;
    memoryHigh: boolean;
  };
};

export default function AdminPerformancePage() {
  const [data, setData] = useState<Metrics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/performance')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError('Failed to load metrics'));
  }, []);

  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 20px', color: '#fff' }}>
      <Link href="/admin" style={{ color: 'var(--primary)' }}>
        ← Admin
      </Link>
      <h1 style={{ fontSize: '32px', fontWeight: 900, margin: '16px 0' }}>Performance (APM)</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        In-process metrics + Sentry Performance traces. Configure alert rules in Sentry for production paging.
      </p>

      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <Stat label="Req/sec" value={data.requestRate.toFixed(2)} alert={false} />
            <Stat label="Error rate" value={`${(data.errorRate * 100).toFixed(2)}%`} alert={data.alerts.errorRateHigh} />
            <Stat label="Queue depth" value={String(data.queueDepth)} alert={data.alerts.queueBacklog} />
            <Stat label="Memory" value={`${data.memory.heapPercent}%`} alert={data.alerts.memoryHigh} />
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Slowest endpoints (p95)</h2>
          <div className="glass-card" style={{ padding: '16px', marginBottom: '24px' }}>
            {data.slowestEndpoints.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No samples yet — traffic will populate this dashboard.</p>
            ) : (
              data.slowestEndpoints.map((row) => (
                <div key={row.route} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span>{row.route}</span>
                  <span style={{ fontFamily: 'monospace' }}>{Math.round(row.p95)}ms · {row.count} reqs</span>
                </div>
              ))
            )}
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            N+1 suspects (dbQueries &gt; 5): {data.nPlusOneRequests} requests in window. Every API response includes{' '}
            <code>X-Request-ID</code> for Sentry correlation.
          </p>
        </>
      )}
    </main>
  );
}

function Stat({ label, value, alert }: { label: string; value: string; alert: boolean }) {
  return (
    <div className="glass-card" style={{ padding: '16px', borderColor: alert ? '#ef4444' : undefined }}>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 900 }}>{value}</div>
    </div>
  );
}
