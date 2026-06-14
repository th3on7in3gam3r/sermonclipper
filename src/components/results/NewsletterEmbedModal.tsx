'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  buildNewsletterEmbedHtml,
  buildNewsletterPlainText,
  NEWSLETTER_PLATFORM_TIPS,
} from '@/lib/embeds/newsletterHtml';

type Props = {
  watchUrl: string;
  thumbnailUrl: string;
  title: string;
  durationLabel?: string;
  onClose: () => void;
};

export default function NewsletterEmbedModal({ watchUrl, thumbnailUrl, title, durationLabel, onClose }: Props) {
  const [mailchimpKey, setMailchimpKey] = useState('');
  const html = buildNewsletterEmbedHtml({ watchUrl, thumbnailUrl, title, durationLabel });
  const plain = buildNewsletterPlainText({ watchUrl, thumbnailUrl, title, durationLabel });

  const connectMailchimp = async () => {
    const res = await fetch('/api/integrations/mailchimp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: mailchimpKey }),
    });
    const data = await res.json();
    if (res.ok) toast.success(data.message || 'Mailchimp connected');
    else toast.error(data.error || 'Connection failed');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-card premium-border modal-panel" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', maxWidth: '640px' }}>
        <h2 style={{ fontWeight: 900, marginBottom: '8px' }}>Newsletter Embed</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
          Email-safe HTML (table layout, 600px max). Paste into Mailchimp, Beehiiv, or ConvertKit.
        </p>

        <textarea readOnly value={html} rows={10} className="referral-input" style={{ width: '100%', fontSize: '11px', marginBottom: '12px' }} />

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <button
            type="button"
            className="vesper-btn vesper-btn-primary"
            onClick={() => {
              void navigator.clipboard.writeText(html);
              toast.success('HTML copied');
            }}
          >
            Copy HTML
          </button>
          <button
            type="button"
            className="vesper-btn-outline"
            onClick={() => {
              void navigator.clipboard.writeText(plain);
              toast.success('Plain text copied');
            }}
          >
            Copy plain text
          </button>
        </div>

        {Object.entries(NEWSLETTER_PLATFORM_TIPS).map(([key, tip]) => (
          <p key={key} style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 8px' }}>
            <strong style={{ textTransform: 'capitalize' }}>{key}:</strong> {tip}
          </p>
        ))}

        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: '13px', fontWeight: 800, marginBottom: '8px' }}>Connect Mailchimp</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="password"
              placeholder="Mailchimp API key"
              value={mailchimpKey}
              onChange={(e) => setMailchimpKey(e.target.value)}
              className="referral-input"
              style={{ flex: 1 }}
            />
            <button type="button" className="vesper-btn-outline" onClick={() => void connectMailchimp()}>
              Connect
            </button>
          </div>
        </div>

        <button type="button" className="vesper-btn-outline" style={{ marginTop: '16px', width: '100%' }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
