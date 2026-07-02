#!/usr/bin/env node
import { copyFile, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'ffmpeg');

let coreRoot;
try {
  const pkgPath = require.resolve('@ffmpeg/core/package.json');
  coreRoot = join(dirname(pkgPath), 'dist', 'esm');
} catch {
  console.warn('[postinstall-ffmpeg] @ffmpeg/core not installed — skipping WASM copy');
  process.exit(0);
}

const files = ['ffmpeg-core.js', 'ffmpeg-core.wasm'];

await mkdir(outDir, { recursive: true });

for (const file of files) {
  const src = join(coreRoot, file);
  const dest = join(outDir, file);
  try {
    await access(src);
    await copyFile(src, dest);
    console.log(`[postinstall-ffmpeg] Copied ${file}`);
  } catch (err) {
    console.warn(`[postinstall-ffmpeg] Could not copy ${file}:`, err instanceof Error ? err.message : err);
  }
}
