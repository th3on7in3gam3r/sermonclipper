import { detectBibleReferences } from '@/lib/bibleVerses';
import { extractQuotableMoments, type QuotableMoment } from '@/lib/quotes/extractQuotables';

export type SermonNotesContent = {
  title: string;
  scriptureReferences: string[];
  keyPoints: string[];
  quotes: QuotableMoment[];
  reflectionQuestions: string[];
  transcript: string;
};

function buildKeyPoints(analysis: Record<string, unknown>): string[] {
  const bullets = (analysis.summaries as { bullet_points?: string[] })?.bullet_points;
  if (bullets?.length) return bullets.slice(0, 6);

  const clips = (analysis.clips as Array<{ hook_title?: string; main_quote?: string }>) || [];
  return clips
    .map((c) => c.hook_title || c.main_quote)
    .filter(Boolean)
    .slice(0, 5) as string[];
}

function buildReflectionQuestions(theme: string, quotes: QuotableMoment[]): string[] {
  const lead = quotes[0]?.text || theme || 'this message';
  const snippet = lead.length > 80 ? `${lead.slice(0, 77)}…` : lead;
  return [
    `Where do you see God inviting you to respond after hearing: "${snippet}"?`,
    `How does this week's theme — ${theme || 'the sermon'} — challenge your daily walk?`,
    `Who in your life needs to hear one of these truths this week, and how can you share it with them?`,
  ];
}

export function generateSermonNotesContent(analysis: Record<string, unknown>): SermonNotesContent {
  const title = String(analysis.sermon_title || analysis.main_theme || 'Sermon Notes');
  const theme = String(analysis.main_theme || '');
  const transcript = String(analysis.manuscriptText || analysis.summary || '');
  const quotes = extractQuotableMoments(analysis as Parameters<typeof extractQuotableMoments>[0]);
  const clipQuotes = ((analysis.clips as Array<{ main_quote?: string }>) || [])
    .map((c) => c.main_quote)
    .filter(Boolean) as string[];
  const scriptureReferences = detectBibleReferences([transcript, ...clipQuotes].join(' ')).map(
    (v) => v.reference
  );

  return {
    title,
    scriptureReferences: [...new Set(scriptureReferences)],
    keyPoints: buildKeyPoints(analysis),
    quotes,
    reflectionQuestions: buildReflectionQuestions(theme, quotes),
    transcript,
  };
}

export function notesToMarkdown(notes: SermonNotesContent): string {
  const lines = [
    `# ${notes.title}`,
    '',
    notes.scriptureReferences.length ? `## Scripture\n${notes.scriptureReferences.map((r) => `- ${r}`).join('\n')}` : '',
    '',
    `## Key Points\n${notes.keyPoints.map((p) => `- ${p}`).join('\n')}`,
    '',
    `## Extended Quotes\n${notes.quotes.map((q) => `- "${q.text}"`).join('\n')}`,
    '',
    `## Reflection Questions\n${notes.reflectionQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`,
    '',
    `## Full Transcript\n${notes.transcript}`,
  ];
  return lines.filter((l) => l !== '').join('\n');
}

export function notesToHtml(notes: SermonNotesContent): string {
  return `<article>
<h1>${notes.title}</h1>
${notes.scriptureReferences.length ? `<h2>Scripture</h2><ul>${notes.scriptureReferences.map((r) => `<li>${r}</li>`).join('')}</ul>` : ''}
<h2>Key Points</h2><ul>${notes.keyPoints.map((p) => `<li>${p}</li>`).join('')}</ul>
<h2>Extended Quotes</h2><ul>${notes.quotes.map((q) => `<li>&ldquo;${q.text}&rdquo;</li>`).join('')}</ul>
<h2>Reflection Questions</h2><ol>${notes.reflectionQuestions.map((q) => `<li>${q}</li>`).join('')}</ol>
<details><summary>Full Transcript</summary><p>${notes.transcript.replace(/\n/g, '<br/>')}</p></details>
</article>`;
}
