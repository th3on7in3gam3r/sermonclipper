import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Sermon from '@/models/Sermon';
import JobProgress from '@/models/JobProgress';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const [user, sermons, jobs] = await Promise.all([
    User.findOne({ clerkId: userId }).lean(),
    Sermon.find({ userId }).lean(),
    JobProgress.find({ userId }).lean(),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    account: {
      email: user?.email,
      plan: user?.plan,
      usageCount: user?.usageCount,
      createdAt: user?.createdAt,
      referralCode: user?.referralCode,
    },
    sermons: sermons.map((s) => ({
      title: s.title,
      jobId: s.jobId,
      createdAt: s.createdAt,
      mainTheme: s.mainTheme,
    })),
    jobs: jobs.map((j) => ({
      jobId: j.jobId,
      step: j.step,
      status: j.status,
      updatedAt: j.updatedAt,
    })),
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="vesper-data-export.json"',
    },
  });
}
