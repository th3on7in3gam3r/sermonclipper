type Props = {
  isYouTubeSource: boolean;
  sermonTitle?: string;
  mainTheme?: string;
  clipCount: number;
  onBatchExport: () => void;
};

/**
 * The sermon's "title card": letterboxed like a film frame, sermon title in
 * the display serif. This is the one bold moment on the results page.
 */
export default function ResultsHero({ isYouTubeSource, sermonTitle, mainTheme, clipCount, onBatchExport }: Props) {
  const ready = clipCount > 0;
  const status = ready
    ? `${clipCount} ${clipCount === 1 ? 'clip' : 'clips'} ready to review`
    : 'Finding the strongest moments in your sermon…';

  return (
    <section className="title-card" aria-labelledby="sermon-title">
      <div className="title-card-frame">
        <p className={`title-card-status${ready ? ' title-card-status--ready' : ''}`} role="status">
          {status}
        </p>
        <h1 id="sermon-title" className="title-card-title">
          {sermonTitle || 'Your sermon'}
        </h1>
        {mainTheme && <p className="title-card-theme">{mainTheme}</p>}

        <div className="title-card-actions">
          {isYouTubeSource ? (
            <p className="title-card-note">
              This sermon came from a YouTube link, so clips can be previewed but not exported. Upload the
              MP4 to export reels.
            </p>
          ) : (
            <button type="button" onClick={onBatchExport} disabled={!ready} className="vesper-btn title-card-export">
              Export all clips
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export function ToolCard({
  title,
  desc,
  action,
  onClick,
  loading,
}: {
  title: string;
  desc: string;
  action: string;
  onClick?: () => void;
  loading?: boolean;
}) {
  const disabled = loading || !onClick;
  return (
    <div className="tool-card">
      <h3>{title}</h3>
      <p>{desc}</p>
      <button type="button" onClick={onClick} disabled={disabled} className="vesper-btn vesper-btn-outline">
        {loading ? 'Working…' : action}
      </button>
    </div>
  );
}
