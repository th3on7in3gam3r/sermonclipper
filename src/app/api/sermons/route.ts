import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Sermon from '@/models/Sermon';

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.MONGODB_URI) {
      console.warn('[Dashboard API] MONGODB_URI missing. Returning empty archive.');
      return NextResponse.json([]);
    }

    await connectDB();
    const sermons = await Sermon.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json(sermons);
  } catch (error) {
    console.error('[Dashboard API] Critical Error:', error);
    // Return empty array instead of 500 to keep UI alive
    return NextResponse.json([], { status: 200 });
  }
}
