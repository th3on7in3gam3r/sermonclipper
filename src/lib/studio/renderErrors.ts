/**
 * Turn Shotstack's render failure text into something a church volunteer can
 * act on. The raw text is kept separately so support can see what happened.
 */
export type RenderFailure = { message: string; detail?: string };

// Checked in order: the specific causes before the broad "couldn't download" one.
const RULES: { test: RegExp; message: string }[] = [
  {
    test: /font/i,
    message: 'A caption font couldn’t be loaded. Pick a different font in Style and export again.',
  },
  {
    test: /duration|length|exceed|out of (?:range|bounds)|beyond/i,
    message: 'The clip runs past the end of the video. Move the end handle earlier and export again.',
  },
  {
    test: /codec|frame ?rate|decode|corrupt|unsupported|invalid (?:file|media|video)|transcod/i,
    message:
      'Shotstack couldn’t read this video’s format. Export the sermon from your editor as a standard MP4 (H.264), upload it again, then export.',
  },
  {
    test: /download|fetch|could not (?:be )?(?:load|access|retriev)|unreachable|access ?denied|forbidden|\b40[34]\b|expired|signature|not found/i,
    message:
      'Shotstack couldn’t download the sermon video. Refresh the page and export again. If it keeps happening, upload the video again.',
  },
];

export function describeRenderFailure(raw?: string | null): RenderFailure {
  const detail = raw?.trim() || undefined;
  if (!detail) return { message: 'The export didn’t finish. Try again in a minute.' };
  const rule = RULES.find((r) => r.test.test(detail));
  return { message: rule?.message ?? 'Shotstack couldn’t finish this export.', detail: detail.slice(0, 300) };
}
