import DocsShell from '@/components/developers/DocsShell';
import { API_CHANGELOG } from '@/content/developers';

export const metadata = { title: 'API Changelog — Vesper Developers' };

export default function ApiChangelogPage() {
  return (
    <DocsShell>
      <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '32px' }}>API Changelog</h1>
      {API_CHANGELOG.map((entry) => (
        <section key={entry.version} style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{entry.version}</h2>
            <span style={{ color: '#71717A', fontSize: '14px' }}>{entry.date}</span>
          </div>
          <ul style={{ color: '#A1A1AA', lineHeight: 1.8, paddingLeft: '20px' }}>
            {entry.changes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      ))}
    </DocsShell>
  );
}
