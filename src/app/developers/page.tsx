import DocsShell from '@/components/developers/DocsShell';
import Link from 'next/link';

export const metadata = {
  title: 'Vesper Developer API',
  description: 'Integrate sermon clipping into your church software with the Vesper REST API.',
};

export default function DevelopersPage() {
  return (
    <DocsShell>
      <h1 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '16px' }}>Vesper Developer Platform</h1>
      <p style={{ color: '#A1A1AA', lineHeight: 1.7, marginBottom: '32px', fontSize: '18px' }}>
        Build integrations for church management systems, media workflows, and custom dashboards using our REST API
        and official TypeScript SDK.
      </p>
      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Link href="/developers/getting-started" className="glass-card" style={{ padding: '24px', textDecoration: 'none', color: '#fff' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Getting Started</h2>
          <p style={{ color: '#71717A', fontSize: '14px' }}>Generate an API key and make your first request in 5 minutes.</p>
        </Link>
        <Link href="/developers/reference" className="glass-card" style={{ padding: '24px', textDecoration: 'none', color: '#fff' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>API Reference</h2>
          <p style={{ color: '#71717A', fontSize: '14px' }}>Full endpoint docs with examples in JS, Python, and cURL.</p>
        </Link>
        <a
          href="https://www.npmjs.com/package/@vesper/sdk"
          target="_blank"
          rel="noopener noreferrer"
          className="glass-card"
          style={{ padding: '24px', textDecoration: 'none', color: '#fff' }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>@vesper/sdk</h2>
          <p style={{ color: '#71717A', fontSize: '14px' }}>Official npm package with TypeScript types and polling helpers.</p>
        </a>
      </div>
    </DocsShell>
  );
}
