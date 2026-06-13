import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await connectDB();

  // Store on user doc for admin metrics (extend with dedicated collection later)
  await User.findOneAndUpdate(
    { clerkId: userId },
    {
      $set: {
        cancelFeedback: {
          reason: body.reason,
          feedback: body.feedback,
          competitor: body.competitor,
          acceptedOffer: body.acceptedOffer,
          at: new Date(),
        },
      },
    }
  );

  return NextResponse.json({ ok: true });
}
