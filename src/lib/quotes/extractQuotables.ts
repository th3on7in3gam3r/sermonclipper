import { parseTime } from '@/lib/parseTime';

export type QuotableMoment = {
  text: string;
  timestampSeconds: number;
  score: number;
};

const RESONANCE_KEYWORDS = [
  'hope',
  'faith',
  'grace',
  'redemption',
  'purpose',
  'love',
  'forgiveness',
  'peace',
  'salvation',
  'mercy',
  'joy',
  'trust',
  'spirit',
  'god',
  'jesus',
  'christ',
  'holy',
  'prayer',
  'worship',
  'gospel',
];

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 20);
}

export function scoreQuoteSentence(text: string): number {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 15) return 0;

  let score = 0;

  if (!/^(and|but|so|because|when|if|that|or|then)\s/i.test(trimmed)) score += 20;

  if (trimmed.length <= 140) score += Math.max(0, 35 - trimmed.length / 8);
  else score -= Math.min(25, (trimmed.length - 140) / 6);

  const lower = trimmed.toLowerCase();
  for (const kw of RESONANCE_KEYWORDS) {
    if (lower.includes(kw)) score += 4;
  }

  if (/^[A-Z"'(]/.test(trimmed) && /[.!?"']$/.test(trimmed)) score += 15;
  const words = trimmed.split(/\s+/).length;
  if (words >= 5 && words <= 28) score += 12;
  if (words < 4) score -= 10;

  return Math.round(score * 10) / 10;
}

type AnalysisInput = {
  summary?: string;
  manuscriptText?: string;
  clips?: Array<{
    start?: number | string;
    end?: number | string;
    main_quote?: string;
    hook_title?: string;
  }>;
};

export function extractQuotableMoments(analysis: AnalysisInput): QuotableMoment[] {
  const candidates: QuotableMoment[] = [];
  const seen = new Set<string>();

  const addCandidate = (text: string, timestampSeconds: number, bonus = 0) => {
    const normalized = text.replace(/\s+/g, ' ').trim();
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) return;
    const score = scoreQuoteSentence(normalized) + bonus;
    if (score < 15) return;
    seen.add(key);
    candidates.push({ text: normalized, timestampSeconds, score });
  };

  for (const clip of analysis.clips || []) {
    const start =
      typeof clip.start === 'number'
        ? clip.start
        : clip.start
          ? parseTime(String(clip.start))
          : 0;
    if (clip.main_quote) addCandidate(clip.main_quote, start, 12);
    if (clip.hook_title && clip.hook_title !== clip.main_quote) {
      addCandidate(clip.hook_title, start, 6);
    }
  }

  const longText = [analysis.manuscriptText, analysis.summary].filter(Boolean).join(' ');
  for (const sentence of splitSentences(longText)) {
    addCandidate(sentence, 0, 0);
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, 5);
}

export function enrichAnalysisWithQuotes<T extends AnalysisInput>(analysis: T): T & { quotable_moments: QuotableMoment[] } {
  return {
    ...analysis,
    quotable_moments: extractQuotableMoments(analysis),
  };
}
