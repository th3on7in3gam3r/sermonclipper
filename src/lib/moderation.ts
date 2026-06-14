import connectDB from '@/lib/mongodb';
import ModerationLog from '@/models/ModerationLog';
import { logAuditEvent } from '@/lib/auditLog';

export type ModerationOutcome = 'pass' | 'flag' | 'block';

const PROFANITY_PATTERNS = [
  /\b(f+u+c+k|sh+i+t|b+i+t+c+h|asshole|damn\s+you)\b/i,
  /\b(kill\s+all|death\s+to)\b/i,
];

const HATE_PATTERNS = [/\b(heil|white\s+power|supremac)\b/i, /swastika/i];

export type ModerationInput = {
  userId: string;
  jobId?: string;
  plan?: string;
  transcript?: string;
  fileName?: string;
};

export type ModerationResult = {
  outcome: ModerationOutcome;
  reasons: string[];
  logId?: string;
};

function scanText(text: string, strict: boolean): { outcome: ModerationOutcome; reasons: string[] } {
  const reasons: string[] = [];
  for (const p of HATE_PATTERNS) {
    if (p.test(text)) reasons.push('Potential hate speech or symbols detected');
  }
  for (const p of PROFANITY_PATTERNS) {
    if (p.test(text)) reasons.push('Profanity or abusive language detected');
  }

  if (reasons.some((r) => r.includes('hate'))) {
    return { outcome: 'block', reasons };
  }
  if (reasons.length > 0) {
    return { outcome: strict ? 'flag' : 'pass', reasons };
  }
  return { outcome: 'pass', reasons: [] };
}

/** Automated moderation — extend with Rekognition / Video Intelligence when configured. */
export async function runModerationCheck(input: ModerationInput): Promise<ModerationResult> {
  const strict = !input.plan || input.plan === 'free';
  const text = input.transcript || input.fileName || '';
  const { outcome, reasons } = scanText(text, strict);

  if (outcome === 'pass' && !reasons.length) {
    return { outcome: 'pass', reasons: [] };
  }

  await connectDB();
  const log = await ModerationLog.create({
    userId: input.userId,
    jobId: input.jobId,
    outcome,
    reasons,
    status: outcome === 'flag' ? 'pending_review' : outcome === 'block' ? 'blocked' : 'cleared',
    automated: true,
  });

  if (outcome === 'block') {
    await logAuditEvent({
      userId: input.userId,
      eventType: 'moderation.blocked',
      metadata: { jobId: input.jobId, reasons },
    });
  } else if (outcome === 'flag') {
    await logAuditEvent({
      userId: input.userId,
      eventType: 'moderation.flagged',
      metadata: { jobId: input.jobId, reasons },
    });
  }

  return { outcome, reasons, logId: String(log._id) };
}

export function moderationErrorMessage() {
  return 'This content was flagged by our automated moderation system and cannot be processed. If you believe this is an error, contact support.';
}
