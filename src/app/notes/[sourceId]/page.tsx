import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';
import connectDB from '@/lib/mongodb';
import SermonNotes from '@/models/SermonNotes';

type Props = { params: Promise<{ sourceId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sourceId } = await params;
  try {
    await connectDB();
    const notes = await SermonNotes.findOne({ slug: sourceId, published: true }).lean();
    if (!notes) return { title: 'Sermon Notes | Vesper' };
    return {
      title: `${notes.title} | Sermon Notes`,
      description: notes.keyPoints?.[0] || 'Sermon notes from Vesper Studio',
      alternates: { canonical: `${SITE_URL}/notes/${sourceId}` },
      openGraph: {
        title: notes.title,
        description: notes.keyPoints?.[0],
        url: `${SITE_URL}/notes/${sourceId}`,
        type: 'article',
      },
    };
  } catch {
    return { title: 'Sermon Notes | Vesper' };
  }
}

export default async function NotesPage({ params }: Props) {
  const { sourceId } = await params;
  await connectDB();
  const notes = await SermonNotes.findOne({ slug: sourceId, published: true }).lean();

  if (!notes) {
    return (
      <main style={{ maxWidth: '720px', margin: '80px auto', padding: '0 20px', color: '#fff' }}>
        <h1>Notes not found</h1>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 20px 80px', color: '#fff' }}>
      <p className="vesper-badge badge-violet" style={{ marginBottom: '16px' }}>
        Sermon Notes
      </p>
      <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, marginBottom: '24px' }}>{notes.title}</h1>

      {notes.scriptureReferences?.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>Scripture</h2>
          <ul style={{ lineHeight: 1.8, color: 'var(--text-muted)' }}>
            {notes.scriptureReferences.map((ref: string) => (
              <li key={ref}>{ref}</li>
            ))}
          </ul>
        </section>
      )}

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>Key Points</h2>
        <ul style={{ lineHeight: 1.8, color: 'var(--text-muted)' }}>
          {notes.keyPoints?.map((point: string) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>Extended Quotes</h2>
        {(notes.quotes as { text: string }[])?.map((q) => (
          <blockquote
            key={q.text}
            style={{
              margin: '0 0 16px',
              padding: '16px 20px',
              borderLeft: '4px solid var(--primary)',
              background: 'rgba(139,92,246,0.08)',
              borderRadius: '8px',
              fontStyle: 'italic',
            }}
          >
            &ldquo;{q.text}&rdquo;
          </blockquote>
        ))}
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>Reflection Questions</h2>
        <ol style={{ lineHeight: 1.8, color: 'var(--text-muted)' }}>
          {notes.reflectionQuestions?.map((q: string) => (
            <li key={q} style={{ marginBottom: '8px' }}>
              {q}
            </li>
          ))}
        </ol>
      </section>

      {notes.transcript && (
        <details style={{ marginBottom: '32px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 800, marginBottom: '12px' }}>Full transcript</summary>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{notes.transcript}</p>
        </details>
      )}

      <footer style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Powered by Vesper Studio</footer>
    </main>
  );
}
