import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isVesperAdmin } from '@/lib/adminBypass';
import { generatePresignedGetUrl } from '@/lib/r2';

/** Admin-only: verify R2 credentials can mint presigned GET URLs (required for Shotstack). */
export async function GET() {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  if (!userId || !isVesperAdmin(userId, clerkUser)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accountId = process.env.CF_ACCOUNT_ID?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();

  const missing = [
    !accountId && 'CF_ACCOUNT_ID',
    !bucket && 'R2_BUCKET',
    !accessKeyId && 'R2_ACCESS_KEY_ID',
    !secretAccessKey && 'R2_SECRET_ACCESS_KEY',
  ].filter(Boolean);

  if (missing.length > 0) {
    return NextResponse.json({
      configured: false,
      missing,
      hint: 'Add R2 env vars in Vercel and redeploy. Exports need presigned URLs so Shotstack can fetch your uploaded MP4.',
    });
  }

  try {
    const probeKey = '__vesper_r2_probe__';
    const signed = await generatePresignedGetUrl(probeKey, 300);
    return NextResponse.json({
      configured: true,
      bucket,
      accountId,
      presignWorks: true,
      signedUrlLength: signed.length,
      hint: 'Presigned URL generation works. If exports still fail, confirm the sermon file exists in R2 for the job.',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown R2 error';
    return NextResponse.json({
      configured: false,
      presignWorks: false,
      error: message,
      hint: 'Check R2 API token permissions (Object Read) and that CF_ACCOUNT_ID / R2_BUCKET match your bucket.',
    });
  }
}
