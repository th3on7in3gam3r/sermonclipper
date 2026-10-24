'use client';

import { useState } from 'react';
import DocsShell from '@/components/developers/DocsShell';
import TryItPanel from '@/components/developers/TryItPanel';
import { API_ENDPOINTS, CODE_SAMPLES } from '@/content/developers';

export default function ReferencePage() {
  const [lang, setLang] = useState<'javascript' | 'python' | 'curl'>('javascript');

  return (
    <DocsShell>
      <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px' }}>API Reference</h1>
      <p style={{ color: 'var(--text-dim)', marginBottom: '32px' }}>Base URL: https://vesper.biblefunland.com</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {(['javascript', 'python', 'curl'] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className={lang === l ? 'vesper-btn vesper-btn-primary' : 'vesper-btn-outline'}
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            {l}
          </button>
        ))}
      </div>

      {API_ENDPOINTS.map((ep) => (
        <section key={ep.id} id={ep.id} style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 900,
                padding: '4px 10px',
                borderRadius: '6px',
                background: ep.method === 'GET' ? 'rgb(var(--success-rgb) / 0.2)' : 'rgb(var(--primary-rgb) / 0.2)',
                color: ep.method === 'GET' ? 'var(--success)' : 'var(--primary)',
              }}
            >
              {ep.method}
            </span>
            <code style={{ fontSize: '15px' }}>{ep.path}</code>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{ep.summary}</p>
          {ep.request && (
            <>
              <div style={{ fontSize: '12px', fontWeight: 800, marginBottom: '8px' }}>Request body</div>
              <pre style={{ background: 'var(--bg)', padding: '16px', borderRadius: '8px', fontSize: '12px' }}>{ep.request}</pre>
            </>
          )}
          <div style={{ fontSize: '12px', fontWeight: 800, marginBottom: '8px', marginTop: '16px' }}>Response</div>
          <pre style={{ background: 'var(--bg)', padding: '16px', borderRadius: '8px', fontSize: '12px' }}>{ep.response}</pre>
          <TryItPanel method={ep.method} path={ep.path} defaultBody={ep.request || undefined} />
        </section>
      ))}

      <section>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>Code sample ({lang})</h2>
        <pre style={{ background: 'var(--bg)', padding: '16px', borderRadius: '8px', fontSize: '12px', overflow: 'auto' }}>
          {CODE_SAMPLES[lang]}
        </pre>
      </section>
    </DocsShell>
  );
}
