import { NextRequest } from 'next/server';
import { authenticateV1Request, v1Error, v1Json } from '@/lib/apiAuth';
import { getClipForUser } from '@/lib/api/v1/clips';
import { planAllowsExport } from '@/lib/plans';
import connectDB from '@/lib/mongodb';
import { progressManager } from '@/lib/progress';
import { getMediaDeliveryUrl } from '@/lib/cdn';
import { dispatchWebhook } from '@/lib/webhooks';

/** POST /api/v1/clips/:id/export — trigger render, return signed download URL when ready */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateV1Request(req);
  if (!auth.ok) return auth.response;

  if (!planAllowsExport(auth.ctx.plan)) {
    return v1Error('Export requires Creator or Church Pro plan.', 403, 'UPGRADE_REQUIRED');
  }

  const { id } = await params;
  const clip = await getClipForUser(auth.ctx.userId, id);
  if (!clip) return v1Error('Clip not found', 404);

  let body: { format?: string; wait?: boolean } = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    /* optional body */
  }

  const format = body.format || '9:16';
  const origin = req.nextUrl.origin;

  const renderRes = await fetch(`${origin}/api/render-clip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: req.headers.get('cookie') || '',
    },
    body: JSON.stringify({
      jobId: clip.sourceId,
      index: clip.index,
      clip: {
        start: clip.start,
        end: clip.end,
        hook_title: clip.title,
        main_quote: clip.quote,
        suggested_captions: clip.captions,
        engagement_hook: clip.engagementHook,
      },
      format,
      videoUrl: undefined,
    }),
  });

  // render-clip requires Clerk session — use internal approach via direct Shotstack call pattern
  // Fallback: return master preview URL + export instructions
  if (!renderRes.ok) {
    await connectDB();
    const state = await progressManager.get(clip.sourceId);
    const master = state?.finalPath;
    if (!master) {
      return v1Error('Export failed — master video not ready.', 502, 'EXPORT_FAILED');
    }
    const downloadUrl = await getMediaDeliveryUrl(master);
    return v1Json({
      export: {
        clipId: id,
        status: 'preview_only',
        format,
        downloadUrl,
        message: 'Full render requires dashboard export; master preview URL provided.',
      },
    });
  }

  const data = await renderRes.json();
  if (!data.shotstackId) {
    return v1Error(data.error || 'Export failed', 502, 'EXPORT_FAILED');
  }

  const shotstackId = data.shotstackId as string;
  let downloadUrl: string | null = null;
  let status = 'processing';

  const maxPolls = body.wait ? 40 : 1;
  for (let i = 0; i < maxPolls; i++) {
    const statusRes = await fetch(`${origin}/api/render-status?id=${encodeURIComponent(shotstackId)}`);
    const statusData = await statusRes.json();
    if (statusData.status === 'done' && statusData.url) {
      downloadUrl = statusData.url;
      status = 'complete';
      break;
    }
    if (statusData.status === 'failed') {
      return v1Error('Cloud render failed', 502, 'RENDER_FAILED');
    }
    if (i < maxPolls - 1) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  void dispatchWebhook(auth.ctx.userId, 'clip.exported', { clipId: id, format, downloadUrl });

  return v1Json({
    export: {
      clipId: id,
      renderId: shotstackId,
      status,
      format,
      downloadUrl,
    },
  });
}
