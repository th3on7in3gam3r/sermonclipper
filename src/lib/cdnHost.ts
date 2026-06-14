/** Strip protocol/trailing slash so callers can safely prefix https:// */
export function normalizeCdnHost(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return raw.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
