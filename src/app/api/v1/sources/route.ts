import { NextRequest } from 'next/server';
import { authenticateV1Request, v1Error, v1Json } from '@/lib/apiAuth';
import { createQueuedJob, triggerJobProcessor } from '@/lib/jobQueue';
import { runModerationCheck, moderationErrorMessage } from '@/lib/moderation';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { dispatchWebhook } from '@/lib/webhooks';

/** POST /api/v1/sources — submit YouTube URL or upload storage key for processing */
export async function POST(req: NextRequest) {
  const auth = await authenticateV1Request(req);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  let body: {
    type?: 'youtube' | 'upload';
    url?: string;
    storageKey?: string;
    manuscript?: string;
  };
  try {
    body = await req.json();
  } catch {
    return v1Error('Invalid JSON body', 400);
  }

  const type = body.type;
  if (type !== 'youtube' && type !== 'upload') {
    return v1Error('type must be "youtube" or "upload"', 400);
  }

  const sourceUrl = type === 'youtube' ? body.url?.trim() : body.storageKey?.trim();
  if (!sourceUrl) {
    return v1Error(type === 'youtube' ? 'url is required' : 'storageKey is required', 400);
  }

  if (type === 'upload' && !sourceUrl.startsWith('uploads/')) {
    return v1Error('storageKey must start with uploads/', 400);
  }

  const moderation = await runModerationCheck({
    userId: ctx.userId,
    plan: ctx.plan,
    transcript: body.manuscript,
    fileName: sourceUrl,
  });

  if (moderation.outcome === 'block') {
    return v1Error(moderationErrorMessage(), 422, 'MODERATION_BLOCKED');
  }

  const payload: Record<string, unknown> = {
    type: type === 'youtube' ? 'youtube' : 'upload',
    url: sourceUrl,
  };
  if (body.manuscript?.trim()) payload.manuscript = body.manuscript.trim();

  const jobId = await createQueuedJob(ctx.userId, payload);
  triggerJobProcessor(jobId, req.nextUrl.origin);

  if (body.manuscript?.trim()) {
    await connectDB();
    await User.findOne({ clerkId: ctx.userId });
    // Manuscript stored when sermon is created; attach to job payload for pipeline
  }

  void dispatchWebhook(ctx.userId, 'source.created', {
    sourceId: jobId,
    type,
    moderation: moderation.outcome,
  });

  return v1Json(
    {
      source: {
        id: jobId,
        status: 'queued',
        type,
        moderation: moderation.outcome,
      },
    },
    202
  );
}
