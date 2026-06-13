/** Allowed upload formats — validated by magic bytes, not extension or Content-Type. */

export type AllowedVideoFormat = 'mp4' | 'mov' | 'webm';

const SIGNATURES: { format: AllowedVideoFormat; bytes: number[]; offset?: number }[] = [
  // MP4/MOV: ftyp box at offset 4
  { format: 'mp4', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
  // WebM: EBML header
  { format: 'webm', bytes: [0x1a, 0x45, 0xdf, 0xa3], offset: 0 },
];

export function detectVideoFormat(buffer: Uint8Array): AllowedVideoFormat | null {
  if (buffer.length < 12) return null;

  for (const sig of SIGNATURES) {
    const offset = sig.offset ?? 0;
    if (buffer.length < offset + sig.bytes.length) continue;
    const match = sig.bytes.every((b, i) => buffer[offset + i] === b);
    if (match) return sig.format;
  }

  return null;
}

export function isAllowedVideoBuffer(buffer: Uint8Array): boolean {
  return detectVideoFormat(buffer) !== null;
}

export function contentTypeForFormat(format: AllowedVideoFormat): string {
  switch (format) {
    case 'webm':
      return 'video/webm';
    case 'mov':
      return 'video/quicktime';
    default:
      return 'video/mp4';
  }
}
