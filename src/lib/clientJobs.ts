/** Queue a background job and return the server-assigned jobId (HTTP 202). */
export async function queueProcessingJob(
  type: 'youtube' | 'upload',
  payload: {
    url: string;
    jobId?: string;
    manuscript?: string;
    preacherName?: string;
  }
): Promise<{ jobId: string } | { error: string; code?: string }> {
  const res = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      url: payload.url,
      jobId: payload.jobId,
      ...(payload.manuscript?.trim() ? { manuscript: payload.manuscript.trim() } : {}),
      ...(payload.preacherName?.trim() ? { preacherName: payload.preacherName.trim() } : {}),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status !== 202) {
    return {
      error: data.details || data.error || 'Failed to queue processing job',
      code: data.code,
    };
  }
  return { jobId: data.jobId as string };
}
