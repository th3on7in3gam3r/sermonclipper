/** Frame capture, scoring, and export helpers for Thumbnail Studio. */

export const THUMBNAIL_EXPORT_SIZES = {
  youtube: { width: 1280, height: 720, label: 'YouTube (16:9)' },
  instagram: { width: 1080, height: 1080, label: 'Instagram (1:1)' },
  reel: { width: 1080, height: 1920, label: 'Reel cover (9:16)' },
} as const;

export type ThumbnailExportKey = keyof typeof THUMBNAIL_EXPORT_SIZES;

export function formatTimecode(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function captureVideoFrame(
  video: HTMLVideoElement,
  time: number
): Promise<{ dataUrl: string; score: number }> {
  return new Promise((resolve, reject) => {
    const seekAndCapture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas unavailable'));
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const score = scoreFramePixels(ctx, canvas.width, canvas.height);
      resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.85), score });
    };

    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      seekAndCapture();
    };

    if (Math.abs(video.currentTime - time) < 0.05 && video.readyState >= 2) {
      seekAndCapture();
      return;
    }

    video.addEventListener('seeked', onSeeked);
    video.currentTime = Math.max(0, Math.min(time, video.duration || time));
  });
}

/** Heuristic visual score: contrast, edge energy, center focus (proxy for expressive framing). */
function scoreFramePixels(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  const sampleW = Math.min(160, w);
  const sampleH = Math.min(90, h);
  const imageData = ctx.getImageData(0, 0, sampleW, sampleH);
  const { data } = imageData;
  let sum = 0;
  let sumSq = 0;
  let edgeSum = 0;
  let centerSum = 0;
  const cx0 = sampleW * 0.25;
  const cx1 = sampleW * 0.75;
  const cy0 = sampleH * 0.2;
  const cy1 = sampleH * 0.8;

  for (let y = 0; y < sampleH; y++) {
    for (let x = 0; x < sampleW; x++) {
      const i = (y * sampleW + x) * 4;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += lum;
      sumSq += lum * lum;

      if (x > 0) {
        const pi = (y * sampleW + (x - 1)) * 4;
        const prev = 0.299 * data[pi] + 0.587 * data[pi + 1] + 0.114 * data[pi + 2];
        edgeSum += Math.abs(lum - prev);
      }

      if (x >= cx0 && x <= cx1 && y >= cy0 && y <= cy1) {
        centerSum += lum;
      }
    }
  }

  const n = sampleW * sampleH;
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  const contrast = Math.sqrt(Math.max(0, variance));
  const edges = edgeSum / n;
  const centerMean = centerSum / ((cx1 - cx0 + 1) * (cy1 - cy0 + 1));

  return contrast * 0.45 + edges * 0.35 + centerMean * 0.2;
}

export async function generateFilmstripFrames(
  video: HTMLVideoElement,
  startSec: number,
  endSec: number,
  intervalSec = 1
): Promise<{ time: number; dataUrl: string; score: number }[]> {
  const frames: { time: number; dataUrl: string; score: number }[] = [];
  const end = Math.min(endSec, video.duration || endSec);
  for (let t = startSec; t <= end; t += intervalSec) {
    const frame = await captureVideoFrame(video, t);
    frames.push({ time: t, ...frame });
  }
  return frames;
}

export function pickBestFrames(
  frames: { time: number; score: number }[],
  count = 3
): number[] {
  return [...frames]
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((f) => f.time);
}

export async function renderThumbnailToBlob(
  baseImage: CanvasImageSource,
  width: number,
  height: number,
  drawOverlays: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const srcW = 'width' in baseImage ? (baseImage as HTMLImageElement).width : canvas.width;
  const srcH = 'height' in baseImage ? (baseImage as HTMLImageElement).height : canvas.height;
  const scale = Math.max(width / srcW, height / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(baseImage, (width - dw) / 2, (height - dh) / 2, dw, dh);
  drawOverlays(ctx, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Export failed'))), 'image/png');
  });
}

export async function downloadThumbnailZip(
  blobs: Record<ThumbnailExportKey, Blob>,
  filename: string
): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  zip.file('youtube-1280x720.png', blobs.youtube);
  zip.file('instagram-1080x1080.png', blobs.instagram);
  zip.file('reel-cover-1080x1920.png', blobs.reel);
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
