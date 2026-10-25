import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Shotstack's fit modes don't match CSS: 'cover' stretches the video to fill the
// frame (distorting it), while 'crop' fills it and keeps the proportions.
const files = ['src/app/api/render-clip/route.ts', 'src/lib/shotstack.ts'];

describe('Shotstack video fit', () => {
  it.each(files)('%s never asks Shotstack to stretch the video', (file) => {
    const src = readFileSync(join(process.cwd(), file), 'utf8');
    expect(src).not.toMatch(/fit:\s*['"](cover|stretch)['"]/);
  });
});
