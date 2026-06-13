'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type WhiteLabelState = {
  churchName?: string;
  logoUrl?: string;
  primaryColor?: string;
  customDomain?: string;
  customDomainVerified?: boolean;
  emailDomain?: string;
  emailDomainVerified?: boolean;
  emailReplyTo?: string;
  showPoweredBy?: boolean;
};

export default function WhiteLabelSettings() {
  const [plan, setPlan] = useState<string>('free');
  const [cnameTarget, setCnameTarget] = useState('app.vesper.studio');
  const [wl, setWl] = useState<WhiteLabelState>({ showPoweredBy: true });
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch('/api/white-label')
      .then((r) => r.json())
      .then((d) => {
        setPlan(d.plan || 'free');
        setWl(d.whiteLabel || {});
        setCnameTarget(d.cnameTarget || 'app.vesper.studio');
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (patch: Partial<WhiteLabelState>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/white-label', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setWl(data.whiteLabel);
      toast.success('White label settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const verify = async (action: 'verify-domain' | 'verify-email') => {
    const res = await fetch('/api/white-label', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (data.verified) {
      toast.success(data.message);
      load();
    } else {
      toast.error(data.message || data.error || 'Verification failed');
    }
  };

  if (plan !== 'church_pro') {
    return (
      <div className="glass-card premium-border" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>White Label</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Serve Vesper on your church domain with branded emails. Available on Church Pro ($49/mo).
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card premium-border" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>White Label — Branding</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
          Replace Vesper branding with your church identity on your custom domain.
        </p>
        <label className="thumb-tool-label">Church name</label>
        <input
          className="vesper-input"
          value={wl.churchName || ''}
          onChange={(e) => setWl((p) => ({ ...p, churchName: e.target.value }))}
          placeholder="Grace Community Church"
          style={{ marginBottom: '12px', width: '100%' }}
        />
        <label className="thumb-tool-label">Logo URL</label>
        <input
          className="vesper-input"
          value={wl.logoUrl || ''}
          onChange={(e) => setWl((p) => ({ ...p, logoUrl: e.target.value }))}
          placeholder="https://yoursite.org/logo.png"
          style={{ marginBottom: '12px', width: '100%' }}
        />
        <label className="thumb-tool-label">Primary color</label>
        <input
          type="color"
          value={wl.primaryColor || '#8B5CF6'}
          onChange={(e) => setWl((p) => ({ ...p, primaryColor: e.target.value }))}
          style={{ marginBottom: '12px' }}
        />
        <label className="thumb-tool-check" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="checkbox"
            checked={wl.showPoweredBy !== false}
            onChange={(e) => setWl((p) => ({ ...p, showPoweredBy: e.target.checked }))}
          />
          Show small &ldquo;Powered by Vesper&rdquo; footer credit
        </label>
        <button type="button" className="vesper-btn vesper-btn-primary" disabled={saving} onClick={() => save(wl)}>
          Save branding
        </button>
      </div>

      <div className="glass-card premium-border" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Custom domain</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>
          Add a CNAME record pointing your subdomain to{' '}
          <code style={{ color: '#C4B5FD' }}>{cnameTarget}</code>, then verify.
        </p>
        <input
          className="vesper-input"
          value={wl.customDomain || ''}
          onChange={(e) => setWl((p) => ({ ...p, customDomain: e.target.value, customDomainVerified: false }))}
          placeholder="media.gracecommunitychurch.com"
          style={{ marginBottom: '12px', width: '100%' }}
        />
        <p style={{ fontSize: '13px', color: wl.customDomainVerified ? '#10B981' : 'var(--text-muted)' }}>
          {wl.customDomainVerified ? '✓ Domain verified' : 'Not verified yet'}
        </p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button type="button" className="vesper-btn-outline" onClick={() => save({ customDomain: wl.customDomain })}>
            Save domain
          </button>
          <button type="button" className="vesper-btn vesper-btn-primary" onClick={() => verify('verify-domain')}>
            Verify domain
          </button>
        </div>
      </div>

      <div className="glass-card premium-border" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Email domain</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>
          Authenticate SPF, DKIM, and DMARC for transactional email from your domain via Resend.
        </p>
        <input
          className="vesper-input"
          value={wl.emailDomain || ''}
          onChange={(e) => setWl((p) => ({ ...p, emailDomain: e.target.value, emailDomainVerified: false }))}
          placeholder="gracecommunitychurch.com"
          style={{ marginBottom: '12px', width: '100%' }}
        />
        <input
          className="vesper-input"
          value={wl.emailReplyTo || ''}
          onChange={(e) => setWl((p) => ({ ...p, emailReplyTo: e.target.value }))}
          placeholder="Reply-To: support@gracecommunitychurch.com"
          style={{ marginBottom: '12px', width: '100%' }}
        />
        <p style={{ fontSize: '13px', color: wl.emailDomainVerified ? '#10B981' : 'var(--text-muted)' }}>
          {wl.emailDomainVerified ? '✓ Email domain verified' : 'Add DNS records in Resend, then verify.'}
        </p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            type="button"
            className="vesper-btn-outline"
            onClick={() => save({ emailDomain: wl.emailDomain, emailReplyTo: wl.emailReplyTo })}
          >
            Save email settings
          </button>
          <button type="button" className="vesper-btn vesper-btn-primary" onClick={() => verify('verify-email')}>
            Verify email domain
          </button>
        </div>
      </div>
    </>
  );
}
