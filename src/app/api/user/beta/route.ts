import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import BetaFeedback from '@/models/BetaFeedback';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ clerkId: userId }).lean();
  return NextResponse.json({
    isBetaTester: user?.isBetaTester ?? false,
    churchType: user?.betaChurchType,
    usageFrequency: user?.betaUsageFrequency,
    changelogOptIn: user?.betaChangelogOptIn ?? false,
    feedbackCount: user?.betaFeedbackCount ?? 0,
  });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await connectDB();

  const update: Record<string, unknown> = {};
  if (typeof body.isBetaTester === 'boolean') update.isBetaTester = body.isBetaTester;
  if (typeof body.churchType === 'string') update.betaChurchType = body.churchType;
  if (typeof body.usageFrequency === 'string') update.betaUsageFrequency = body.usageFrequency;
  if (typeof body.changelogOptIn === 'boolean') update.betaChangelogOptIn = body.changelogOptIn;

  await User.updateOne({ clerkId: userId }, { $set: update });

  if (body.feedback && typeof body.feedback === 'object') {
    await BetaFeedback.create({
      userId,
      feature: String(body.feedback.feature || 'general'),
      worksWell: body.feedback.worksWell,
      confusing: body.feedback.confusing,
      missing: body.feedback.missing,
    });
    await User.updateOne({ clerkId: userId }, { $inc: { betaFeedbackCount: 1 } });
  }

  return NextResponse.json({ success: true });
}
