import { extractQuotableMoments } from '@/lib/quotes/extractQuotables';

type SermonRow = {
  analysis?: Record<string, unknown>;
  title?: string;
};

export function collectWeeklyQuotes(sermons: SermonRow[]) {
  return sermons
    .flatMap((s) =>
      extractQuotableMoments((s.analysis || {}) as Parameters<typeof extractQuotableMoments>[0]).map((q) => ({
        text: q.text,
        sermonTitle: s.title || 'Sermon',
        score: q.score,
      }))
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
