/** FFmpeg WASM assets — copied to /public/ffmpeg by scripts/postinstall-ffmpeg.mjs */
export const FFMPEG_CORE_VERSION = '0.12.6';

const LOCAL_CORE_BASE = '/ffmpeg';
const CDN_CORE_BASE = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;

/** Prefer same-origin ESM build (module worker); CDN is fallback only. */
export const FFMPEG_WASM_URLS = {
  coreURL: `${LOCAL_CORE_BASE}/ffmpeg-core.js`,
  wasmURL: `${LOCAL_CORE_BASE}/ffmpeg-core.wasm`,
  workerURL: `${LOCAL_CORE_BASE}/worker.js`,
  cdnCoreURL: `${CDN_CORE_BASE}/ffmpeg-core.js`,
  cdnWasmURL: `${CDN_CORE_BASE}/ffmpeg-core.wasm`,
} as const;

export async function probeFfmpegAsset(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const type = res.headers.get('content-type') || '';
    if (!res.ok) return false;
    if (url.endsWith('.wasm')) return type.includes('wasm') || type.includes('octet-stream');
    return type.includes('javascript') || type.includes('ecmascript');
  } catch {
    return false;
  }
}

export async function resolveFfmpegWasmUrls(): Promise<{
  coreURL: string;
  wasmURL: string;
  workerURL: string;
}> {
  const localOk = await probeFfmpegAsset(FFMPEG_WASM_URLS.wasmURL);
  if (localOk) {
    return {
      coreURL: FFMPEG_WASM_URLS.coreURL,
      wasmURL: FFMPEG_WASM_URLS.wasmURL,
      workerURL: FFMPEG_WASM_URLS.workerURL,
    };
  }

  return {
    coreURL: FFMPEG_WASM_URLS.cdnCoreURL,
    wasmURL: FFMPEG_WASM_URLS.cdnWasmURL,
    workerURL: FFMPEG_WASM_URLS.workerURL,
  };
}
