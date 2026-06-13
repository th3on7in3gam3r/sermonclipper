/** Shotstack render output URLs (S3). Cross-origin — browsers ignore `<a download>`. */
export function isShotstackOutputUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host.endsWith('.amazonaws.com') && (host.includes('shotstack') || host.startsWith('shotstack-api'))
    );
  } catch {
    return false;
  }
}

export function sanitizeReelFilename(title: string): string {
  const slug = title
    .slice(0, 48)
    .replace(/[^\w-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const base = slug || 'vesper-reel';
  return base.endsWith('.mp4') ? base : `${base}.mp4`;
}

/** Trigger a file download via same-origin proxy (works for Shotstack S3 URLs). */
export function triggerReelDownload(renderUrl: string, title: string): void {
  const filename = sanitizeReelFilename(title);
  const params = new URLSearchParams({ url: renderUrl, filename });
  const a = document.createElement('a');
  a.href = `/api/reel-download?${params.toString()}`;
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
