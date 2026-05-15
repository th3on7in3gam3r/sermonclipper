import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Sermon from '@/models/Sermon';

export async function GET() {
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

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await connectDB();
    const result = await Sermon.deleteOne({ _id: id, userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Sermons DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
