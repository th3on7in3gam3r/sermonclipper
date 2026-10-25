'use client';

import toast from 'react-hot-toast';

/** Copy text and confirm with a toast; reports failure instead of throwing. */
export async function copyToClipboard(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  } catch {
    toast.error('Could not copy — your browser blocked clipboard access.');
  }
}
