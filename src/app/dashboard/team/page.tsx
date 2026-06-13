'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import StudioHelpShell from '@/components/help/StudioHelpShell';

type TeamData = {
  name: string;
  seatLimit: number;
  memberCount: number;
  members: { email: string; name?: string; role: string }[];
  pendingInvites: { email: string; role: string }[];
  isOwner: boolean;
};

export default function TeamSettingsPage() {
  const [team, setTeam] = useState<TeamData | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [loading, setLoading] = useState(true);

  const loadTeam = () => {
    fetch('/api/team')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) toast.error(data.error);
        else setTeam(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const invite = async () => {
    if (!email.trim()) return;
    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), role }),
    });
    const data = await res.json();
    if (!res.ok) toast.error(data.error || 'Invite failed');
    else {
      toast.success('Invite sent');
      setEmail('');
      loadTeam();
    }
  };

  const removeMember = async (memberEmail: string) => {
    if (!confirm(`Remove ${memberEmail} from the team?`)) return;
    const res = await fetch(`/api/team?email=${encodeURIComponent(memberEmail)}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Member removed');
      loadTeam();
    }
  };

  return (
    <StudioHelpShell>
    <main className="vesper-mesh-bg-container" style={{ minHeight: '100vh' }}>
      <div className="vesper-mesh-bg" />
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '120px 24px 80px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Link
          href="/dashboard"
          style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}
        >
          ← Back to Studio
        </Link>
        <h1 style={{ fontSize: '36px', fontWeight: 900, margin: '16px 0 8px' }}>Team settings</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
          Church Pro multi-user access — invite editors and viewers to a shared clip library.
        </p>

        {loading ? (
          <p>Loading team…</p>
        ) : team ? (
          <>
            <div className="glass-card premium-border" style={{ padding: '24px', marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {team.memberCount} of {team.seatLimit} seats used
              </p>
              <h2 style={{ fontSize: '20px', fontWeight: 900 }}>{team.name}</h2>
            </div>

            {team.isOwner && (
              <div className="glass-card premium-border" style={{ padding: '24px', marginBottom: '24px' }}>
                <h3
                  style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '16px' }}
                >
                  INVITE MEMBER
                </h3>
                <input
                  type="email"
                  placeholder="colleague@church.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)',
                    color: '#fff',
                    marginBottom: '12px',
                  }}
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    background: '#212130',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <option value="editor">Editor — create and export clips</option>
                  <option value="viewer">Viewer — view clips only</option>
                </select>
                <button
                  type="button"
                  className="vesper-btn vesper-btn-primary shimmer-effect"
                  onClick={invite}
                >
                  Send invite
                </button>
              </div>
            )}

            <div className="glass-card premium-border" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '16px' }}>
                MEMBERS
              </h3>
              {team.members.map((m) => (
                <div
                  key={m.email}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 800 }}>{m.name || m.email}</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {m.email} · {m.role}
                    </p>
                  </div>
                  {team.isOwner && m.role !== 'owner' && (
                    <button
                      type="button"
                      className="vesper-btn-outline"
                      style={{ color: '#EF4444' }}
                      onClick={() => removeMember(m.email)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {team.pendingInvites.length > 0 && (
                <>
                  <h4
                    style={{
                      marginTop: '20px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    PENDING
                  </h4>
                  {team.pendingInvites.map((i) => (
                    <p
                      key={i.email}
                      style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px' }}
                    >
                      {i.email} ({i.role})
                    </p>
                  ))}
                </>
              )}
            </div>
          </>
        ) : null}
      </div>
    </main>
    </StudioHelpShell>
  );
}
