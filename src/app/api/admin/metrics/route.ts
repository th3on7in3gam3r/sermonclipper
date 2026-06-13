import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Sermon from '@/models/Sermon';
import JobProgress from '@/models/JobProgress';
import { isVesperAdmin } from '@/lib/adminBypass';

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  creator: 19,
  church_pro: 49,
};

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  if (!userId || !isVesperAdmin(userId, clerkUser)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 86400000);
  const d30 = new Date(now.getTime() - 30 * 86400000);

  const [totalUsers, signups30, signups7, users] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: d30 } }),
    User.countDocuments({ createdAt: { $gte: d7 } }),
    User.find().lean(),
  ]);

  const activeUsers = await User.countDocuments({
    $or: [{ lastActiveAt: { $gte: d30 } }, { createdAt: { $gte: d30 } }],
  });

  const planCounts = { free: 0, creator: 0, church_pro: 0 };
  let mrr = 0;
  for (const u of users) {
    const plan = (u.plan as keyof typeof planCounts) || 'free';
    if (plan in planCounts) planCounts[plan] += 1;
    mrr += PLAN_PRICES[plan] || 0;
  }

  const jobs = await JobProgress.find({ updatedAt: { $gte: d30 } })
    .lean()
    .catch(() => []);
  const clipsPerDay: Record<string, number> = {};
  let uploadCount = 0;
  let youtubeCount = 0;

  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    clipsPerDay[d.toISOString().slice(0, 10)] = 0;
  }

  const sermonCount = await Sermon.countDocuments({ createdAt: { $gte: d30 } }).catch(() => 0);

  const NpsResponse = (await import('@/models/NpsResponse')).default;
  const npsRows = await NpsResponse.find().lean();
  const npsAvg =
    npsRows.length > 0
      ? Math.round((npsRows.reduce((s, r) => s + r.score, 0) / npsRows.length) * 10) / 10
      : 0;
  const npsDistribution = Array.from({ length: 11 }, (_, score) => ({
    score,
    count: npsRows.filter((r) => r.score === score).length,
  }));

  for (const j of jobs as { updatedAt?: Date; finalPath?: string }[]) {
    const day = j.updatedAt ? new Date(j.updatedAt).toISOString().slice(0, 10) : null;
    if (day && day in clipsPerDay) clipsPerDay[day] += 1;
    const path = j.finalPath || '';
    if (path.includes('youtube') || path.includes('youtu')) youtubeCount += 1;
    else if (path) uploadCount += 1;
  }

  const chartData = Object.entries(clipsPerDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, clips]) => ({ date, clips }));

  const avgClips = activeUsers > 0 ? Math.round(((sermonCount as number) / activeUsers) * 10) / 10 : 0;

  return NextResponse.json({
    users: { total: totalUsers, signups30, signups7, activeUsers, planCounts },
    revenue: { mrr, planCounts },
    usage: {
      chartData,
      uploadCount,
      youtubeCount,
      avgClipsPerUser: avgClips,
    },
    nps: {
      average: npsAvg,
      responses: npsRows.length,
      distribution: npsDistribution,
      feedback: npsRows.filter((r) => r.feedback).map((r) => ({ score: r.score, feedback: r.feedback })),
    },
  });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  if (!userId || !isVesperAdmin(userId, clerkUser)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { clerkId, plan } = await req.json();
  if (!clerkId || !['free', 'creator', 'church_pro'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  await connectDB();
  await User.updateOne({ clerkId }, { $set: { plan } });
  return NextResponse.json({ success: true });
}
