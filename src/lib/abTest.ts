import connectDB from '@/lib/mongodb';
import AbTestEvent, { type AbTestEventType } from '@/models/AbTestEvent';

export async function logAbTestEvent(params: {
  testName: string;
  variant: 'A' | 'B' | 'C';
  eventType: AbTestEventType;
  anonymousId?: string;
  userId?: string;
}) {
  await connectDB();
  await AbTestEvent.create(params);
}

export async function getAbTestStats(testName: string) {
  await connectDB();
  const events = await AbTestEvent.find({ testName }).lean();
  const variants = ['A', 'B', 'C'] as const;
  const stats = variants.map((variant) => {
    const rows = events.filter((e) => e.variant === variant);
    const impressions = rows.filter((e) => e.eventType === 'impression').length;
    const clicks = rows.filter((e) => e.eventType === 'click').length;
    const signups = rows.filter((e) => e.eventType === 'signup').length;
    const conversionRate = impressions > 0 ? Math.round((signups / impressions) * 1000) / 10 : 0;
    return { variant, impressions, clicks, signups, conversionRate };
  });

  const totalSignups = stats.reduce((s, v) => s + v.signups, 0);
  const significant = stats.every((v) => v.signups >= 100);
  const minSignups = Math.min(...stats.map((v) => v.signups));

  return {
    testName,
    variants: stats,
    significant,
    significanceNote: significant
      ? 'Statistically reliable (100+ signups per variant)'
      : `Need ~100 signups per variant for reliable results (${minSignups} min so far)`,
  };
}
