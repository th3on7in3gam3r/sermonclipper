/** Parse AI timestamps (seconds or MM:SS / HH:MM:SS) into whole seconds. */
export function parseTime(timeVal: unknown): number {
  if (typeof timeVal === 'number') return Math.floor(timeVal);
  if (!timeVal) return 0;
  const str = String(timeVal);
  if (str.includes(':')) {
    const parts = str.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }
  return Math.floor(Number(str)) || 0;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
