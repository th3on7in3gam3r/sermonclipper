import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Sermon from '@/models/Sermon';
import Team from '@/models/Team';
import { withTelemetry } from '@/lib/telemetry/apiHandler';

async function getAccessibleUserIds(userId: string): Promise<string[]> {
  const team =
    (await Team.findOne({ ownerId: userId })) || (await Team.findOne({ 'members.userId': userId }));
  if (!team) return [userId];
  const ids = new Set<string>([team.ownerId]);
  for (const m of team.members) {
    if (m.userId) ids.add(m.userId);
  }
  return [...ids];
}

async function getHandler(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.MONGODB_URI) {
      console.warn('[Dashboard API] MONGODB_URI missing. Returning empty archive.');
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    await connectDB();

    if (jobId) {
      const sermon = await Sermon.findOne({ userId, jobId });
      if (!sermon) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(sermon);
    }

    const sermons = await Sermon.find({ userId: { $in: await getAccessibleUserIds(userId) } }).sort({
      createdAt: -1,
    });

    return NextResponse.json(sermons);
  } catch (error) {
    console.error('[Dashboard API] Critical Error:', error);
    // Return empty array instead of 500 to keep UI alive
    return NextResponse.json([], { status: 200 });
  }
}

async function deleteHandler(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const idsParam = searchParams.get('ids');
    const ids = idsParam ? idsParam.split(',').filter(Boolean) : id ? [id] : [];

    if (!ids.length) return NextResponse.json({ error: 'Missing ID(s)' }, { status: 400 });

    await connectDB();
    const accessible = await getAccessibleUserIds(userId);
    const result = await Sermon.deleteMany({ _id: { $in: ids }, userId: { $in: accessible } });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: result.deletedCount });
  } catch (error) {
    console.error('[Sermons DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export const GET = withTelemetry(getHandler, 'GET /api/sermons');
export const DELETE = withTelemetry(deleteHandler, 'DELETE /api/sermons');
