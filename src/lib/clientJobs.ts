/** Queue a background job and return the server-assigned jobId (HTTP 202). */
export async function queueProcessingJob(
  type: 'youtube' | 'upload',
  payload: { url: string; jobId?: string }
): Promise<{ jobId: string } | { error: string; code?: string }> {
  const res = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'youtube', ...payload }),
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
