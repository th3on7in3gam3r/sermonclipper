import DocsShell from '@/components/developers/DocsShell';
import TryItPanel from '@/components/developers/TryItPanel';
import { CODE_SAMPLES } from '@/content/developers';

export const metadata = { title: 'Getting Started — Vesper Developers' };

export default function GettingStartedPage() {
  return (
    <DocsShell>
      <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '24px' }}>Getting Started</h1>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>1. Generate an API key</h2>
        <p style={{ color: '#A1A1AA', lineHeight: 1.7, marginBottom: '12px' }}>
          Go to <strong>Dashboard → Settings → Developer</strong> and create a key. Keys are prefixed{' '}
          <code>vsp_live_</code> (production) or <code>vsp_test_</code> (sandbox). The full key is shown once — store it
          securely.
        </p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>2. Authenticate requests</h2>
        <p style={{ color: '#A1A1AA', lineHeight: 1.7, marginBottom: '12px' }}>
          Pass your key in the <code>Authorization</code> header:
        </p>
        <pre style={{ background: '#0a0a0f', padding: '16px', borderRadius: '8px', fontSize: '13px' }}>
          Authorization: Bearer vsp_live_...
        </pre>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>3. Submit a sermon source</h2>
        <pre style={{ background: '#0a0a0f', padding: '16px', borderRadius: '8px', fontSize: '13px', overflow: 'auto' }}>
          {CODE_SAMPLES.curl}
        </pre>
        <TryItPanel
          method="POST"
          path="/api/v1/sources"
          defaultBody={'{\n  "type": "youtube",\n  "url": "https://www.youtube.com/watch?v=..."\n}'}
        />
      </section>

      <section>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>4. Install the SDK</h2>
        <pre style={{ background: '#0a0a0f', padding: '16px', borderRadius: '8px', fontSize: '13px' }}>
          npm install @vesper/sdk
        </pre>
        <pre style={{ background: '#0a0a0f', padding: '16px', borderRadius: '8px', fontSize: '13px', marginTop: '12px', overflow: 'auto' }}>
          {CODE_SAMPLES.javascript}
        </pre>
      </section>
    </DocsShell>
  );
}
