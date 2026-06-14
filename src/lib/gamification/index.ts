import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import UserMilestone from '@/models/UserMilestone';
import { MILESTONE_LABELS, MILESTONE_TYPES, type MilestoneType } from '@/lib/gamification/labels';

function isoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function parseWeekKey(key: string) {
  const [y, w] = key.split('-W').map(Number);
  return { year: y, week: w };
}

function isPriorWeek(lastWeek: string, currentWeek: string) {
  const last = parseWeekKey(lastWeek);
  const current = parseWeekKey(currentWeek);
  if (current.year === last.year && current.week === last.week + 1) return true;
  if (current.year === last.year + 1 && last.week >= 52 && current.week === 1) return true;
  return false;
}

function displayStreak(gamification: Record<string, unknown>) {
  const lastWeek = gamification.lastClipWeek as string | undefined;
  const stored = Number(gamification.currentStreak || 0);
  if (!lastWeek || stored === 0) return 0;
  const currentWeek = isoWeekKey();
  if (lastWeek === currentWeek || isPriorWeek(lastWeek, currentWeek)) return stored;
  return 0;
}

export async function notifyMilestoneUnlocks(userId: string, types: MilestoneType[]) {
  if (types.length === 0) return;
  const { createNotification } = await import('@/lib/notifications');
  for (const type of types) {
    await createNotification({
      userId,
      type: 'achievement_unlocked',
      message: `Achievement unlocked: ${MILESTONE_LABELS[type]}!`,
      link: '/dashboard/settings#achievements',
      pushTitle: 'Achievement unlocked',
    });
  }
}

export async function checkOneYearMilestone(userId: string) {
  await connectDB();
  const user = await User.findOne({ clerkId: userId }).lean();
  if (!user?.createdAt) return [] as MilestoneType[];
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  if (Date.now() - new Date(user.createdAt).getTime() < oneYearMs) return [] as MilestoneType[];
  return awardMilestone(userId, 'one_year');
}

export async function recordWeeklyClipActivity(userId: string) {
  await connectDB();
  const user = await User.findOne({ clerkId: userId });
  if (!user) return { currentStreak: 0, bestStreak: 0, newMilestones: [] as MilestoneType[] };

  const week = isoWeekKey();
  const gamification = (user.get('gamification') as Record<string, unknown>) || {};
  const lastWeek = gamification.lastClipWeek as string | undefined;
  let currentStreak = Number(gamification.currentStreak || 0);
  let bestStreak = Number(gamification.bestStreak || 0);

  if (lastWeek === week) {
    /* already counted this week */
  } else if (lastWeek && isPriorWeek(lastWeek, week)) {
    currentStreak = currentStreak + 1;
  } else {
    currentStreak = 1;
  }

  bestStreak = Math.max(bestStreak, currentStreak);
  user.set('gamification', { ...gamification, currentStreak, bestStreak, lastClipWeek: week });
  await user.save();

  const newMilestones = await awardMilestone(userId, 'first_clip');
  await notifyMilestoneUnlocks(userId, newMilestones);
  return { currentStreak, bestStreak, newMilestones };
}

export async function awardMilestone(userId: string, type: MilestoneType) {
  await connectDB();
  const existing = await UserMilestone.findOne({ userId, milestoneType: type }).lean();
  if (existing) return [] as MilestoneType[];

  await UserMilestone.create({ userId, milestoneType: type });
  return [type];
}

export async function getGamificationSummary(userId: string) {
  await connectDB();
  const user = await User.findOne({ clerkId: userId }).lean();
  const gamification = (user?.gamification as Record<string, number | string>) || {};
  const oneYear = await checkOneYearMilestone(userId);
  await notifyMilestoneUnlocks(userId, oneYear);
  const milestones = await UserMilestone.find({ userId }).sort({ achievedAt: -1 }).lean();

  return {
    currentStreak: displayStreak(gamification),
    bestStreak: Number(gamification.bestStreak || 0),
    milestones: milestones.map((m) => ({
      type: m.milestoneType,
      label: MILESTONE_LABELS[m.milestoneType as MilestoneType],
      achievedAt: m.achievedAt,
    })),
    allMilestoneTypes: MILESTONE_TYPES,
  };
}

export async function incrementClipCountMilestones(userId: string, totalClips: number) {
  const unlocked: MilestoneType[] = [];
  if (totalClips >= 10) unlocked.push(...(await awardMilestone(userId, 'clips_10')));
  if (totalClips >= 100) unlocked.push(...(await awardMilestone(userId, 'clips_100')));
  await notifyMilestoneUnlocks(userId, unlocked);
  return unlocked;
}

export async function recordClipGamification(userId: string) {
  const streak = await recordWeeklyClipActivity(userId);
  await connectDB();
  const Sermon = (await import('@/models/Sermon')).default;
  const totalClips = await Sermon.countDocuments({ userId });
  const countMilestones = await incrementClipCountMilestones(userId, totalClips);
  return { ...streak, newMilestones: [...streak.newMilestones, ...countMilestones] };
}

export { isoWeekKey };
