import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Sermon from '@/models/Sermon';

type BioPageConfig = {
  enabled?: boolean;
  username?: string;
  churchName?: string;
  description?: string;
  social?: { instagram?: string; tiktok?: string; youtube?: string };
  showRecentClips?: boolean;
  background?: string;
};

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  await connectDB();

  const user = await User.findOne({ 'bioPage.username': username.toLowerCase() }).lean();
  if (!user) {
    return NextResponse.json({ error: 'Bio page not found' }, { status: 404 });
  }

  const bio = (user.bioPage || {}) as BioPageConfig;
  if (bio.enabled === false) {
    return NextResponse.json({ error: 'Bio page disabled' }, { status: 404 });
  }

  const paidPlans = ['creator', 'church_pro'];
  if (!paidPlans.includes(user.plan) && bio.enabled !== true) {
    return NextResponse.json({ error: 'Bio page requires a paid plan' }, { status: 404 });
  }

  let recentClips: { clipId: string; caption: string; videoUrl: string }[] = [];
  if (bio.showRecentClips !== false) {
    const sermons = await Sermon.find({ userId: user.clerkId }).sort({ createdAt: -1 }).limit(5).lean();
    for (const sermon of sermons) {
      const analysis = sermon.analysis as { clips?: { hook_title?: string; main_quote?: string }[] } | undefined;
      analysis?.clips?.slice(0, 1).forEach((clip, clipIndex) => {
        if (recentClips.length >= 3) return;
        recentClips.push({
          clipId: `${sermon.jobId}-${clipIndex}`,
          caption: clip.hook_title || clip.main_quote || sermon.title,
          videoUrl: sermon.finalPath || sermon.videoUrl,
        });
      });
    }
  }

  const whiteLabel = user.whiteLabel as { logoUrl?: string; churchName?: string } | undefined;

  return NextResponse.json({
    username: bio.username,
    churchName: bio.churchName || whiteLabel?.churchName || 'Church',
    description: bio.description || '',
    logoUrl: whiteLabel?.logoUrl,
    social: bio.social || {},
    background: bio.background || 'linear-gradient(160deg, #0d0d14 0%, #1a1033 100%)',
    recentClips,
    showPoweredBy: user.plan !== 'church_pro',
  });
}
