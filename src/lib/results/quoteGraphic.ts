import { wrapWords } from './helpers';

const SIZE = 1080;

/** Draw a 1080×1080 Quote Vault graphic and trigger a PNG download. Browser-only. */
export function downloadQuoteGraphic(quote: string, sermonTitle: string | undefined, index: number): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  grad.addColorStop(0, '#0A0A0F');
  grad.addColorStop(1, '#2c1954');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Decorative quotation mark
  ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
  ctx.font = '900 600px sans-serif';
  ctx.fillText('"', 80, 500);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lines = wrapWords(`"${quote}"`, 800, (s) => ctx.measureText(s).width);
  const lineHeight = 80;
  let y = (SIZE - lines.length * lineHeight) / 2 + 40;
  for (const l of lines) {
    ctx.fillText(l, SIZE / 2, y);
    y += lineHeight;
  }

  ctx.fillStyle = '#8B5CF6';
  ctx.font = '900 28px sans-serif';
  ctx.fillText('VESPER', SIZE / 2, 950);

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '400 24px sans-serif';
  ctx.fillText(sermonTitle || 'Sermon Highlight', SIZE / 2, 990);

  const link = document.createElement('a');
  link.download = `quote-vault-${index + 1}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  return true;
}
