'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { SITE_URL } from '@/lib/siteConfig';

type BioPageConfig = {
  username?: string;
  churchName?: string;
  description?: string;
  enabled?: boolean;
  showRecentClips?: boolean;
  background?: string;
  social?: { instagram?: string; tiktok?: string; youtube?: string };
};

export default function ProfileSettingsPanel() {
  const [bioPage, setBioPage] = useState<BioPageConfig>({ showRecentClips: true, enabled: true });
  const [showcaseOptIn, setShowcaseOptIn] = useState(false);
  const [autoClipSundayStream, setAutoClipSundayStream] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/user/profile-settings')
      .then((r) => r.json())
      .then((d) => {
        setBioPage(d.bioPage || { showRecentClips: true, enabled: true });
        setShowcaseOptIn(Boolean(d.showcaseOptIn));
        setAutoClipSundayStream(Boolean(d.autoClipSundayStream));
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    const res = await fetch('/api/user/profile-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bioPage, showcaseOptIn, autoClipSundayStream }),
    });
    setSaving(false);
    if (res.ok) toast.success('Settings saved');
    else {
      const data = await res.json();
      toast.error(data.error || 'Save failed');
    }
  };

  const bioUrl = bioPage.username ? `${SITE_URL}/bio/${bioPage.username}` : null;

  return (
    <div className="glass-card premium-border" style={{ padding: 24, marginBottom: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Bio Page & Showcase</h2>

      <label className="settings-toggle" style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
        <input type="checkbox" checked={showcaseOptIn} onChange={(e) => setShowcaseOptIn(e.target.checked)} />
        Allow Vesper to showcase my clips publicly
      </label>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, paddingLeft: 28 }}>
        Opted-in clips may appear on the public{' '}
        <a href="/showcase" style={{ color: 'var(--accent-violet)' }}>
          Showcase
        </a>{' '}
        page. You can turn this off anytime.
      </p>

      <label className="settings-toggle" style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={autoClipSundayStream}
          onChange={(e) => setAutoClipSundayStream(e.target.checked)}
        />
        Auto-Clip Sunday Stream (Monday morning)
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          className="vesper-input"
          placeholder="Bio username (e.g. gracechurch)"
          value={bioPage.username || ''}
          onChange={(e) => setBioPage((p) => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') }))}
        />
        <input
          className="vesper-input"
          placeholder="Church name"
          value={bioPage.churchName || ''}
          onChange={(e) => setBioPage((p) => ({ ...p, churchName: e.target.value }))}
        />
        <textarea
          className="vesper-input"
          rows={2}
          placeholder="Short bio / tagline"
          value={bioPage.description || ''}
          onChange={(e) => setBioPage((p) => ({ ...p, description: e.target.value }))}
        />
        <input
          className="vesper-input"
          placeholder="Instagram URL"
          value={bioPage.social?.instagram || ''}
          onChange={(e) => setBioPage((p) => ({ ...p, social: { ...p.social, instagram: e.target.value } }))}
        />
        <input
          className="vesper-input"
          placeholder="TikTok URL"
          value={bioPage.social?.tiktok || ''}
          onChange={(e) => setBioPage((p) => ({ ...p, social: { ...p.social, tiktok: e.target.value } }))}
        />
        <input
          className="vesper-input"
          placeholder="YouTube URL"
          value={bioPage.social?.youtube || ''}
          onChange={(e) => setBioPage((p) => ({ ...p, social: { ...p.social, youtube: e.target.value } }))}
        />
        <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={bioPage.showRecentClips !== false}
            onChange={(e) => setBioPage((p) => ({ ...p, showRecentClips: e.target.checked }))}
          />
          Show recent clips on bio page
        </label>
      </div>

      {bioUrl && (
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
          Your bio link:{' '}
          <a href={bioUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-violet)' }}>
            {bioUrl}
          </a>
        </p>
      )}

      <button type="button" className="vesper-btn vesper-btn-primary" style={{ marginTop: 16 }} disabled={saving} onClick={save}>
        {saving ? 'Saving…' : 'Save profile settings'}
      </button>
    </div>
  );
}
