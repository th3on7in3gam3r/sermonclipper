/** @ffmpeg/core UMD build served from unpkg (public/ffmpeg/ has wrappers only, not the WASM binary). */
export const FFMPEG_CORE_VERSION = '0.12.6';

const FFMPEG_CORE_BASE = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`;

export const FFMPEG_WASM_URLS = {
  coreURL: `${FFMPEG_CORE_BASE}/ffmpeg-core.js`,
  wasmURL: `${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`,
  workerURL: '/ffmpeg/worker.js',
} as const;
