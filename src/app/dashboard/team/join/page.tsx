'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [info, setInfo] = useState<{ teamName: string; role: string; email: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/team/join?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) toast.error(data.error);
        else setInfo(data);
      });
  }, [token]);

  const accept = async () => {
    const res = await fetch('/api/team/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) toast.error(data.error || 'Could not join team');
    else {
      toast.success(`Welcome to ${data.teamName}!`);
      router.push('/dashboard');
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="glass-card premium-border" style={{ maxWidth: '440px', padding: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px' }}>Team invite</h1>
        {info ? (
          <>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
              You have been invited to join <strong>{info.teamName}</strong> as <strong>{info.role}</strong>.
            </p>
            <button type="button" className="vesper-btn vesper-btn-primary shimmer-effect" onClick={accept} style={{ width: '100%' }}>
              Accept invite
            </button>
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Loading invite…</p>
        )}
        <Link href="/dashboard" style={{ display: 'block', marginTop: '16px', fontSize: '13px', color: 'var(--text-dim)' }}>
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}

export default function TeamJoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinContent />
    </Suspense>
  );
}
