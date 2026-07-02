import { PREPARE_FILE_STEPS, YOUTUBE_PREVIEW_ONLY_NOTE } from '@/content/prepareSermonFile';

type PrepareFileGuideProps = {
  showYoutubePreviewNote?: boolean;
  compact?: boolean;
};

export default function PrepareFileGuide({ showYoutubePreviewNote = false, compact = false }: PrepareFileGuideProps) {
  return (
    <aside className={`hero-prepare-guide${compact ? ' hero-prepare-guide--compact' : ''}`}>
      {showYoutubePreviewNote ? (
        <p className="hero-prepare-guide-banner">{YOUTUBE_PREVIEW_ONLY_NOTE}</p>
      ) : null}

      <p className="hero-prepare-guide-kicker">From YouTube to Vesper</p>
      <h3 className="hero-prepare-guide-title">How to prepare your sermon file</h3>
      <ol className="hero-prepare-guide-steps">
        {PREPARE_FILE_STEPS.map((step, index) => (
          <li key={step.title} className="hero-prepare-guide-step">
            <span className="hero-prepare-guide-step-num">{index + 1}</span>
            <div>
              <strong className="hero-prepare-guide-step-title">{step.title}</strong>
              <p className="hero-prepare-guide-step-detail">{step.detail}</p>
              {step.link ? (
                <a
                  className="hero-prepare-guide-link"
                  href={step.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {step.link.label} →
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      <p className="hero-prepare-guide-footnote">
        Vesper works best with a file you own. Once your sermon is under 500MB, upload it and we&apos;ll take it from
        there.
      </p>
    </aside>
  );
}
