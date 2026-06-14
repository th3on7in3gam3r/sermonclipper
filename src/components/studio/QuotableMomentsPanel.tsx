'use client';

import toast from 'react-hot-toast';
import { formatTime } from '@/lib/parseTime';
import type { QuotableMoment } from '@/lib/quotes/extractQuotables';

type Props = {
  quotes: QuotableMoment[];
  onSeek: (seconds: number) => void;
  onCreateQuoteCard: (quote: string) => void;
};

export default function QuotableMomentsPanel({ quotes, onSeek, onCreateQuoteCard }: Props) {
  if (!quotes.length) {
    return (
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
        Quotable moments appear after AI analysis completes on your sermon.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
        Top shareable lines scored for brevity, resonance, and clarity.
      </p>
      {quotes.map((q, i) => (
        <div key={`${q.text.slice(0, 24)}-${i}`} className="glass-card" style={{ padding: '14px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '15px', lineHeight: 1.55, fontStyle: 'italic' }}>
            &ldquo;{q.text}&rdquo;
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              className="vesper-btn-outline"
              style={{ fontSize: '11px', padding: '8px 10px' }}
              onClick={() => onSeek(q.timestampSeconds)}
            >
              {formatTime(q.timestampSeconds)}
            </button>
            <button
              type="button"
              className="vesper-btn-outline"
              style={{ fontSize: '11px', padding: '8px 10px' }}
              onClick={() => {
                void navigator.clipboard.writeText(q.text);
                toast.success('Quote copied');
              }}
            >
              Copy Quote
            </button>
            <button
              type="button"
              className="vesper-btn vesper-btn-primary"
              style={{ fontSize: '11px', padding: '8px 10px' }}
              onClick={() => onCreateQuoteCard(q.text)}
            >
              Create Quote Card
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
