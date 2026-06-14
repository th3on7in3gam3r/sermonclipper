import JSZip from 'jszip';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Sermon from '@/models/Sermon';
import ClipExport from '@/models/ClipExport';
import ClipPublication from '@/models/ClipPublication';
import { Webhook } from '@/models/Webhook';
import { getUserAuditLog } from '@/lib/auditLog';
import { uploadBufferToR2, generatePresignedGetUrl } from '@/lib/r2';

async function fetchBinary(url: string, maxBytes = 80 * 1024 * 1024): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const len = Number(res.headers.get('content-length') || 0);
    if (len > maxBytes) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

export async function buildUserDataExportZip(userId: string) {
  await connectDB();
  const user = await User.findOne({ clerkId: userId }).lean();
  if (!user) throw new Error('User not found');

  const [sermons, exports, publications, webhooks, auditLog] = await Promise.all([
    Sermon.find({ userId }).lean(),
    ClipExport.find({ userId }).lean(),
    ClipPublication.find({ userId }).lean(),
    Webhook.find({ userId }).lean(),
    getUserAuditLog(userId, 365),
  ]);

  const zip = new JSZip();
  const clipsFolder = zip.folder('clips');
  const thumbsFolder = zip.folder('thumbnails');

  const clipsMetadata = sermons.flatMap((sermon) => {
    const analysis = sermon.analysis as { clips?: Record<string, unknown>[] } | undefined;
    return (analysis?.clips || []).map((clip, index) => ({
      clipId: `${sermon.jobId}:${index}`,
      sermonTitle: sermon.title,
      jobId: sermon.jobId,
      start: clip.start,
      end: clip.end,
      hook_title: clip.hook_title,
      main_quote: clip.main_quote,
      viral_score: clip.viral_score,
      suggested_captions: clip.suggested_captions,
      createdAt: sermon.createdAt,
    }));
  });

  for (const row of exports) {
    const file = await fetchBinary(row.renderUrl);
    if (file && clipsFolder) {
      clipsFolder.file(`${row.clipId.replace(':', '-')}.mp4`, file);
    }
    if (row.thumbnailUrl && thumbsFolder) {
      const thumb = await fetchBinary(row.thumbnailUrl, 5 * 1024 * 1024);
      if (thumb) thumbsFolder.file(`${row.clipId.replace(':', '-')}.jpg`, thumb);
    }
  }

  zip.file(
    'account.json',
    JSON.stringify(
      {
        name: user.whiteLabel?.churchName,
        email: user.email,
        plan: user.plan,
        joinedDate: user.createdAt,
        locale: user.locale,
        settings: {
          preferredBibleTranslation: user.preferredBibleTranslation,
          showcaseOptIn: user.showcaseOptIn,
          autoClipSundayStream: user.autoClipSundayStream,
        },
      },
      null,
      2
    )
  );

  zip.file('clips_metadata.json', JSON.stringify(clipsMetadata, null, 2));
  zip.file(
    'sources_metadata.json',
    JSON.stringify(
      sermons.map((s) => ({
        title: s.title,
        jobId: s.jobId,
        mainTheme: s.mainTheme,
        videoUrl: s.videoUrl,
        createdAt: s.createdAt,
        note: 'Raw source media is not included in GDPR exports.',
      })),
      null,
      2
    )
  );
  zip.file(
    'social_posts.json',
    JSON.stringify(
      publications.map((p) => ({
        clipId: p.clipId,
        platform: p.platform,
        externalId: p.externalId,
        postUrl: p.postUrl,
        publishedAt: p.publishedAt,
      })),
      null,
      2
    )
  );
  zip.file(
    'billing_history.json',
    JSON.stringify(
      {
        plan: user.plan,
        status: user.status,
        stripeCustomerId: user.stripeCustomerId ? '[redacted-id-on-file]' : null,
        cancelFeedback: user.cancelFeedback || null,
        note: 'Full invoice PDFs are available from your Stripe customer portal.',
      },
      null,
      2
    )
  );
  zip.file(
    'webhooks.json',
    JSON.stringify(
      webhooks.map((w) => ({ url: w.url, events: w.events, createdAt: w.createdAt })),
      null,
      2
    )
  );
  zip.file('audit_log.json', JSON.stringify(auditLog.slice(0, 500), null, 2));
  zip.file(
    'README.txt',
    `Vesper Studio data export\nGenerated: ${new Date().toISOString()}\nClips folder includes exported MP4s we have on file. Re-export reels in Studio if a file is missing.\n`
  );

  const buffer = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  const key = `exports/${userId}/${Date.now()}-vesper-data-export.zip`;
  await uploadBufferToR2(key, buffer, 'application/zip');
  const downloadUrl = await generatePresignedGetUrl(key, 48 * 3600);
  return { downloadUrl, key };
}
