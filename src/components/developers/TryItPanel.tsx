'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

type Props = {
  method: string;
  path: string;
  defaultBody?: string;
};

export default function TryItPanel({ method, path, defaultBody }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [body, setBody] = useState(defaultBody || '');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!apiKey.trim()) {
      toast.error('Paste your API key first');
      return;
    }
    setLoading(true);
    try {
      const url = path.includes(':id') ? path.replace(':id', 'YOUR_SOURCE_ID') : path;
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: method !== 'GET' && method !== 'DELETE' ? body : undefined,
      });
      const text = await res.text();
      setResponse(`${res.status} ${res.statusText}\n\n${text}`);
    } catch (e) {
      setResponse(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '20px', marginTop: '24px' }}>
      <div style={{ fontSize: '11px', fontWeight: 900, color: '#8B5CF6', marginBottom: '12px' }}>TRY IT</div>
      <input
        type="password"
        placeholder="vsp_live_..."
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        style={{
          width: '100%',
          marginBottom: '12px',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.03)',
          color: '#fff',
        }}
      />
      {defaultBody && (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          style={{
            width: '100%',
            marginBottom: '12px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.03)',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        />
      )}
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading}
        className="vesper-btn vesper-btn-primary"
        style={{ marginBottom: '12px' }}
      >
        {loading ? 'Sending…' : `Send ${method}`}
      </button>
      {response && (
        <pre
          style={{
            background: '#0a0a0f',
            padding: '16px',
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '12px',
            color: '#E4E4E7',
          }}
        >
          {response}
        </pre>
      )}
    </div>
  );
}
