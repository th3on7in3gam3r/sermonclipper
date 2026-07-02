/** Max size for a single direct browser-to-R2 upload (presigned URL). */
export const MAX_DIRECT_UPLOAD_MB = 500;
export const MAX_DIRECT_UPLOAD_BYTES = MAX_DIRECT_UPLOAD_MB * 1024 * 1024;
export const MAX_DIRECT_UPLOAD_LABEL = `${MAX_DIRECT_UPLOAD_MB}MB`;

export function isWithinDirectUploadLimit(bytes: number): boolean {
  return bytes > 0 && bytes <= MAX_DIRECT_UPLOAD_BYTES;
}

export function formatUploadLimitError(sizeBytes: number): string {
  const sizeMb = Math.round(sizeBytes / (1024 * 1024));
  return `File is ${sizeMb}MB — maximum direct upload is ${MAX_DIRECT_UPLOAD_LABEL}. Download the sermon as MP4 or M4A first (from YouTube or your editor), compress if needed, then upload here.`;
}
