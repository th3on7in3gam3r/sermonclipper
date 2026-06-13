import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sermon from '@/models/Sermon';
import User from '@/models/User';
import { parseClipId } from '@/lib/mediaDetection';
import { getR2ObjectUrl } from '@/lib/r2';

/** Embed video redirect — tracks views separately from Studio plays. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ clipId: string }> }) {
  const { clipId } = await params;
  const parsed = parseClipId(clipId);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid clip ID' }, { status: 400 });
  }

  await connectDB();
  const sermon = await Sermon.findOne({ jobId: parsed.jobId }).lean();
  if (!sermon) {
    return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
  }

  const user = await User.findOne({ clerkId: sermon.userId }).lean();
  const showPoweredBy = user?.plan !== 'church_pro';

  const videoUrl = sermon.finalPath || sermon.videoUrl;
  const redirectUrl = videoUrl.startsWith('uploads/')
    ? getR2ObjectUrl(videoUrl)
    : videoUrl;

  // Track embed view (fire-and-forget increment on user doc)
  User.updateOne({ clerkId: sermon.userId }, { $inc: { 'analytics.embedViews': 1 } }).catch(() => {});

  if (req.nextUrl.searchParams.get('meta') === '1') {
    const analysis = sermon.analysis as {
      clips?: { hook_title?: string; main_quote?: string }[];
      speaker?: string;
      church_name?: string;
    };
    const clip = analysis?.clips?.[parsed.clipIndex];
    const whiteLabel = user?.whiteLabel as { logoUrl?: string; churchName?: string } | undefined;

    return NextResponse.json({
      videoUrl: redirectUrl,
      caption: clip?.hook_title || clip?.main_quote || sermon.title,
      churchName: whiteLabel?.churchName || analysis?.church_name || sermon.title,
      logoUrl: whiteLabel?.logoUrl,
      showPoweredBy,
      clipStart: clip ? (clip as { start?: number }).start : 0,
    });
  }

  return NextResponse.redirect(redirectUrl, { status: 302 });
}
