import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sermon from '@/models/Sermon';
import ClipExport from '@/models/ClipExport';
import User from '@/models/User';
import { parseClipId, formatClipId } from '@/lib/api/v1/clips';
import { getMediaDeliveryUrl } from '@/lib/cdn';

function normalizeClipId(raw: string) {
  if (raw.includes(':')) return raw;
  const idx = raw.lastIndexOf('-');
  if (idx <= 0) return raw;
  return `${raw.slice(0, idx)}:${raw.slice(idx + 1)}`;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ clipId: string }> }
) {
  const { clipId: raw } = await context.params;
  const clipId = normalizeClipId(decodeURIComponent(raw));
  const parsed = parseClipId(clipId);
  if (!parsed) return NextResponse.json({ error: 'Invalid clip' }, { status: 400 });

  await connectDB();
  const sermon = await Sermon.findOne({ jobId: parsed.jobId }).lean();
  if (!sermon) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const analysis = sermon.analysis as { clips?: Record<string, unknown>[] } | undefined;
  const clip = analysis?.clips?.[parsed.index];
  if (!clip) return NextResponse.json({ error: 'Clip not found' }, { status: 404 });

  const user = await User.findOne({ clerkId: sermon.userId }).lean();
  const exportRow = await ClipExport.findOne({
    userId: sermon.userId,
    clipId: formatClipId(parsed.jobId, parsed.index),
  }).lean();

  let videoUrl = exportRow?.renderUrl || sermon.videoUrl;
  if (!exportRow?.renderUrl && sermon.finalPath) {
    videoUrl = await getMediaDeliveryUrl(sermon.finalPath);
  }

  const title =
    (clip.hook_title as string) || (clip.main_quote as string) || sermon.title || 'Sermon clip';

  return NextResponse.json({
    clipId: formatClipId(parsed.jobId, parsed.index),
    title,
    sermonTitle: sermon.title,
    createdAt: sermon.createdAt,
    videoUrl,
    thumbnailUrl: exportRow?.thumbnailUrl,
    churchName: user?.whiteLabel?.churchName,
    logoUrl: user?.whiteLabel?.logoUrl,
    website: user?.whiteLabel?.customDomain,
    showPoweredBy: user?.whiteLabel?.showPoweredBy !== false && user?.plan !== 'church_pro',
  });
}
