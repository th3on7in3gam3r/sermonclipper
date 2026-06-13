'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ReferralCard from '@/components/dashboard/ReferralCard';
import WhiteLabelSettings from '@/components/dashboard/WhiteLabelSettings';
import ProfileSettingsPanel from '@/components/dashboard/ProfileSettingsPanel';
import StudioHelpShell from '@/components/help/StudioHelpShell';

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube Shorts' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
];

export default function AccountSettingsPage() {
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhooks, setWebhooks] = useState<{ _id: string; url: string; events: string[] }[]>([]);

  const loadWebhooks = () => {
    fetch('/api/webhooks')
      .then((r) => r.json())
      .then((d) => setWebhooks(d.webhooks || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetch('/api/social/connections')
      .then((r) => r.json())
      .then((d) => setConnections(d.connections || {}))
      .catch(() => {});
    loadWebhooks();
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

  const exportData = () => {
    window.location.href = '/api/account/export';
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    const res = await fetch('/api/account/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: 'DELETE' }),
    });
    if (res.ok) {
      toast.success('Account deleted');
      window.location.href = '/';
    } else {
      const data = await res.json();
      toast.error(data.error || 'Deletion failed');
    }
  };

  const addWebhook = async () => {
    if (!webhookUrl) return;
    const res = await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl }),
    });
    if (res.ok) {
      setWebhookUrl('');
      loadWebhooks();
      toast.success('Webhook added');
    }
  };

  const connectPlanningCenter = async () => {
    const res = await fetch('/api/planning-center/connect');
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else toast(data.message || 'Planning Center not configured yet');
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
        <h1 style={{ fontSize: '36px', fontWeight: 900, margin: '16px 0 8px' }}>Account settings</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
          Connected accounts, webhooks, and privacy controls.
        </p>

        <div className="glass-card premium-border" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Social accounts</h2>
          {PLATFORMS.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
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

        <WhiteLabelSettings />
        <ProfileSettingsPanel />

        <div className="glass-card premium-border" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>Planning Center</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>
            Import upcoming sermons and pre-fill clip metadata from your service plan.
          </p>
          <button type="button" className="vesper-btn-outline" onClick={connectPlanningCenter}>
            Connect Planning Center
          </button>
        </div>

        <div className="glass-card premium-border" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>Webhooks</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>
            Receive POST events for clip.created, clip.exported, and quota.warning.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="referral-input"
            />
            <button type="button" className="vesper-btn-outline" onClick={addWebhook}>
              Add
            </button>
          </div>
          {webhooks.map((w) => (
            <p key={w._id} style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {w.url}
            </p>
          ))}
        </div>

        <ReferralCard />

        <div className="glass-card premium-border" style={{ padding: '24px', marginTop: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>Your data</h2>
          <button
            type="button"
            className="vesper-btn-outline"
            onClick={exportData}
            style={{ marginRight: '8px' }}
          >
            Export My Data
          </button>
          <button
            type="button"
            className="vesper-btn-outline"
            style={{ color: '#FCA5A5', borderColor: '#FCA5A5' }}
            onClick={() => setShowDeleteModal(true)}
          >
            Delete My Account
          </button>
        </div>

        {showDeleteModal && (
          <div className="cookie-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="cookie-modal glass-card" onClick={(e) => e.stopPropagation()}>
              <h3>Delete account</h3>
              <p>This permanently deletes your account, clips, and data. Type DELETE to confirm.</p>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="referral-input"
                placeholder="DELETE"
              />
              <button
                type="button"
                className="vesper-btn vesper-btn-primary"
                style={{ background: '#DC2626' }}
                onClick={deleteAccount}
              >
                Permanently delete
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
    </StudioHelpShell>
  );
}
