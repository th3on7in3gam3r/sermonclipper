'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { notesToHtml, notesToMarkdown } from '@/lib/sermonNotes/generateNotes';

type NotesData = {
  title: string;
  scriptureReferences: string[];
  keyPoints: string[];
  quotes: { text: string; timestampSeconds?: number }[];
  reflectionQuestions: string[];
  transcript: string;
  slug?: string;
  published?: boolean;
};

type Props = {
  jobId: string;
};

export default function SermonNotesEditor({ jobId }: Props) {
  const [notes, setNotes] = useState<NotesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/sermon-notes/${jobId}`)
      .then((r) => r.json())
      .then((d) => setNotes(d.notes || null))
      .catch(() => {});
  }, [jobId]);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sermon-notes/${jobId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      setNotes(data.notes);
      toast.success('Sermon notes generated');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!notes) return;
    const res = await fetch(`/api/sermon-notes/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notes),
    });
    if (res.ok) toast.success('Notes saved');
    else toast.error('Save failed');
  };

  const publish = async () => {
    const res = await fetch(`/api/sermon-notes/${jobId}/publish`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      setNotes((prev) => (prev ? { ...prev, published: true, slug: data.slug } : prev));
      toast.success('Published — link copied');
      void navigator.clipboard.writeText(`${window.location.origin}${data.url}`);
    } else toast.error(data.error || 'Publish failed');
  };

  if (!notes) {
    return (
      <div className="glass-card premium-border" style={{ padding: '24px', marginTop: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Sermon Notes</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
          Auto-generate a publishable sermon summary with scripture, key points, quotes, and reflection questions.
        </p>
        <button type="button" className="vesper-btn vesper-btn-primary" onClick={() => void generate()} disabled={loading}>
          {loading ? 'Generating…' : 'Generate Sermon Notes'}
        </button>
      </div>
    );
  }

  const exportNotes = notes as Parameters<typeof notesToMarkdown>[0];

  return (
    <div className="glass-card premium-border" style={{ padding: '24px', marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Sermon Notes</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="vesper-btn-outline" onClick={() => void save()}>
            Save
          </button>
          <button type="button" className="vesper-btn-outline" onClick={() => void publish()}>
            Publish URL
          </button>
        </div>
      </div>

      <input
        value={notes.title}
        onChange={(e) => setNotes({ ...notes, title: e.target.value })}
        className="referral-input"
        style={{ width: '100%', marginBottom: '12px', fontWeight: 800, fontSize: '18px' }}
      />

      <SectionEditor
        label="Scripture references (one per line)"
        value={notes.scriptureReferences.join('\n')}
        onChange={(v) => setNotes({ ...notes, scriptureReferences: v.split('\n').filter(Boolean) })}
      />
      <SectionEditor
        label="Key points (one per line)"
        value={notes.keyPoints.join('\n')}
        onChange={(v) => setNotes({ ...notes, keyPoints: v.split('\n').filter(Boolean) })}
      />
      <SectionEditor
        label="Extended quotes (one per line)"
        value={notes.quotes.map((q) => q.text).join('\n')}
        onChange={(v) =>
          setNotes({
            ...notes,
            quotes: v.split('\n').filter(Boolean).map((text) => ({ text })),
          })
        }
      />
      <SectionEditor
        label="Reflection questions (one per line)"
        value={notes.reflectionQuestions.join('\n')}
        onChange={(v) => setNotes({ ...notes, reflectionQuestions: v.split('\n').filter(Boolean) })}
      />

      <button
        type="button"
        className="vesper-btn-outline"
        style={{ width: '100%', marginBottom: '8px' }}
        onClick={() => setTranscriptOpen((o) => !o)}
      >
        {transcriptOpen ? 'Hide' : 'Show'} full transcript
      </button>
      {transcriptOpen && (
        <SectionEditor
          label="Transcript"
          value={notes.transcript}
          onChange={(v) => setNotes({ ...notes, transcript: v })}
          rows={8}
        />
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
        <button
          type="button"
          className="vesper-btn-outline"
          onClick={() => {
            void navigator.clipboard.writeText(notesToMarkdown(exportNotes));
            toast.success('Markdown copied');
          }}
        >
          Copy Markdown
        </button>
        <button
          type="button"
          className="vesper-btn-outline"
          onClick={() => {
            void navigator.clipboard.writeText(notesToHtml(exportNotes));
            toast.success('HTML copied');
          }}
        >
          Copy HTML
        </button>
        {notes.published && notes.slug && (
          <a href={`/notes/${notes.slug}`} target="_blank" rel="noreferrer" className="vesper-btn-outline" style={{ textDecoration: 'none' }}>
            View public page
          </a>
        )}
      </div>
    </div>
  );
}

function SectionEditor({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label style={{ display: 'block', marginBottom: '12px' }}>
      <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--text-muted)' }}>
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="referral-input"
        style={{ width: '100%', resize: 'vertical', lineHeight: 1.5 }}
      />
    </label>
  );
}
