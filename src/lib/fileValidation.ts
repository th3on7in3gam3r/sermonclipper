/** Allowed upload formats — validated by magic bytes, not extension or Content-Type. */

export type AllowedVideoFormat = 'mp4' | 'mov' | 'webm';
export type AllowedAudioFormat = 'mp3' | 'm4a' | 'aac';
export type AllowedMediaFormat = AllowedVideoFormat | AllowedAudioFormat;

const VIDEO_SIGNATURES: { format: AllowedVideoFormat; bytes: number[]; offset?: number }[] = [
  { format: 'mp4', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
  { format: 'webm', bytes: [0x1a, 0x45, 0xdf, 0xa3], offset: 0 },
];

const AUDIO_SIGNATURES: { format: AllowedAudioFormat; bytes: number[]; offset?: number }[] = [
  { format: 'mp3', bytes: [0x49, 0x44, 0x33], offset: 0 },
  { format: 'mp3', bytes: [0xff, 0xfb], offset: 0 },
  { format: 'mp3', bytes: [0xff, 0xf3], offset: 0 },
  { format: 'mp3', bytes: [0xff, 0xfa], offset: 0 },
  { format: 'aac', bytes: [0xff, 0xf1], offset: 0 },
  { format: 'aac', bytes: [0xff, 0xf9], offset: 0 },
];

function matchSignature(
  buffer: Uint8Array,
  sig: { bytes: number[]; offset?: number }
): boolean {
  const offset = sig.offset ?? 0;
  if (buffer.length < offset + sig.bytes.length) return false;
  return sig.bytes.every((b, i) => buffer[offset + i] === b);
}

export function detectVideoFormat(buffer: Uint8Array): AllowedVideoFormat | null {
  if (buffer.length < 12) return null;
  for (const sig of VIDEO_SIGNATURES) {
    if (matchSignature(buffer, sig)) return sig.format;
  }
  return null;
}

export function detectAudioFormat(buffer: Uint8Array): AllowedAudioFormat | null {
  if (buffer.length < 4) return null;
  for (const sig of AUDIO_SIGNATURES) {
    if (matchSignature(buffer, sig)) return sig.format;
  }
  return null;
}

export function detectMediaFormat(buffer: Uint8Array, fileName?: string): AllowedMediaFormat | null {
  const audio = detectAudioFormat(buffer);
  if (audio) return audio;

  const video = detectVideoFormat(buffer);
  if (video) {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'm4a' || ext === 'aac') return ext === 'm4a' ? 'm4a' : 'aac';
    return video;
  }

  return null;
}

export function isAllowedVideoBuffer(buffer: Uint8Array): boolean {
  return detectVideoFormat(buffer) !== null;
}

export function isAllowedAudioBuffer(buffer: Uint8Array): boolean {
  return detectAudioFormat(buffer) !== null;
}

export function isAllowedMediaBuffer(buffer: Uint8Array, fileName?: string): boolean {
  return detectMediaFormat(buffer, fileName) !== null;
}

export function isAudioMediaFormat(format: AllowedMediaFormat): boolean {
  return format === 'mp3' || format === 'm4a' || format === 'aac';
}

export function contentTypeForFormat(format: AllowedMediaFormat): string {
  switch (format) {
    case 'webm':
      return 'video/webm';
    case 'mov':
      return 'video/quicktime';
    case 'mp3':
      return 'audio/mpeg';
    case 'm4a':
      return 'audio/mp4';
    case 'aac':
      return 'audio/aac';
    default:
      return 'video/mp4';
  }
}
