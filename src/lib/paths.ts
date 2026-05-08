import { join } from 'path';

// Use system absolute /tmp for cloud compatibility (Koyeb, Railway, etc.)
export const TMP_DIR = '/tmp';

export function getTmpPath(filename: string) {
  return join(TMP_DIR, filename);
}
