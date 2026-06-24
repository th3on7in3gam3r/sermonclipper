'use client';

interface HeroManuscriptInputProps {
  preacherName: string;
  manuscript: string;
  onPreacherNameChange: (value: string) => void;
  onManuscriptChange: (value: string) => void;
}

export default function HeroManuscriptInput({
  preacherName,
  manuscript,
  onPreacherNameChange,
  onManuscriptChange,
}: HeroManuscriptInputProps) {
  return (
    <div className="hero-manuscript-section">
      <div className="hero-manuscript-card glass-card">
        <p className="hero-manuscript-label">Optional context</p>
        <p className="hero-manuscript-hint">
          Paste sermon notes or a transcript excerpt. Add your pastor&apos;s name for quote cards and captions.
        </p>

        <label htmlFor="preacher-name-input" className="hero-manuscript-field-label">
          Pastor / preacher name
        </label>
        <input
          id="preacher-name-input"
          type="text"
          placeholder="e.g. Pastor James Wilson"
          value={preacherName}
          onChange={(e) => onPreacherNameChange(e.target.value)}
          className="hero-manuscript-input"
          autoComplete="name"
        />

        <label htmlFor="manuscript-input" className="hero-manuscript-field-label">
          Paste sermon notes / manuscript
        </label>
        <textarea
          id="manuscript-input"
          placeholder="Paste an outline, manuscript, or transcript excerpt…"
          value={manuscript}
          onChange={(e) => onManuscriptChange(e.target.value)}
          className="hero-manuscript-textarea"
          rows={4}
        />
        <p className="hero-manuscript-footnote">
          Improves clip detection, section titles, and attribution when provided.
        </p>
      </div>
    </div>
  );
}
