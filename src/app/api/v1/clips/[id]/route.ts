import { NextRequest } from 'next/server';
import { authenticateV1Request, v1Error, v1Json } from '@/lib/apiAuth';
import {
  getClipForUser,
  parseClipId,
  resolveClipDownloadUrl,
} from '@/lib/api/v1/clips';
import connectDB from '@/lib/mongodb';
import Sermon from '@/models/Sermon';
import { logAuditEvent } from '@/lib/auditLog';

/** GET /api/v1/clips/:id — clip metadata + download URL */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateV1Request(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const clip = await getClipForUser(auth.ctx.userId, id);
  if (!clip) return v1Error('Clip not found', 404);

  const downloadUrl = await resolveClipDownloadUrl(auth.ctx.userId, id);

  return v1Json({ clip: { ...clip, downloadUrl } });
}

/** DELETE /api/v1/clips/:id — remove clip from sermon analysis */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateV1Request(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = parseClipId(id);
  if (!parsed) return v1Error('Invalid clip id format. Use jobId:index', 400);

  await connectDB();
  const sermon = await Sermon.findOne({ userId: auth.ctx.userId, jobId: parsed.jobId });
  if (!sermon) return v1Error('Clip not found', 404);

  const analysis = sermon.analysis as { clips?: unknown[] } | undefined;
  const clips = analysis?.clips || [];
  if (parsed.index >= clips.length) return v1Error('Clip not found', 404);

  clips.splice(parsed.index, 1);
  sermon.analysis = { ...analysis, clips };
  sermon.markModified('analysis');
  await sermon.save();

  await logAuditEvent({
    userId: auth.ctx.userId,
    eventType: 'clip.deleted',
    metadata: { clipId: id },
  });

  return v1Json({ deleted: true, clipId: id });
}
