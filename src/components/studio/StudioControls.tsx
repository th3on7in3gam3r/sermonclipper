'use client';

import { useId, useState, type CSSProperties, type ReactNode } from 'react';

/*
 * Small form controls for the studio inspector. Choices are native radio
 * inputs (arrow keys, screen readers and focus come for free) styled as rows.
 */

export type Choice = {
  id: string;
  title: string;
  desc?: string;
  /** Visual preview shown at the start of the row. */
  preview?: ReactNode;
  /** Shown as a plan badge; selecting calls onLocked instead of onChange. */
  lockedLabel?: string;
  titleStyle?: CSSProperties;
};

export function ChoiceList({
  legend,
  name,
  value,
  choices,
  onChange,
  onLocked,
  layout = 'rows',
}: {
  legend: string;
  name: string;
  value: string;
  choices: Choice[];
  onChange: (id: string) => void;
  onLocked?: (id: string) => void;
  layout?: 'rows' | 'tiles';
}) {
  return (
    <fieldset className="studio-group">
      <legend className="studio-group-title">{legend}</legend>
      <div className={layout === 'tiles' ? 'studio-tiles' : 'studio-choices'}>
        {choices.map((c) => {
          const checked = value === c.id;
          return (
            <label key={c.id} className={`studio-choice${checked ? ' is-checked' : ''}${layout === 'tiles' ? ' studio-choice--tile' : ''}`}>
              <input
                type="radio"
                className="sr-only"
                name={name}
                value={c.id}
                checked={checked}
                onChange={() => (c.lockedLabel && onLocked ? onLocked(c.id) : onChange(c.id))}
              />
              {c.preview}
              <span className="studio-choice-text">
                <span className="studio-choice-title" style={c.titleStyle}>
                  {c.title}
                  {c.lockedLabel && <span className="studio-plan-badge">{c.lockedLabel}</span>}
                </span>
                {c.desc && <span className="studio-choice-desc">{c.desc}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="studio-toggle">
      <span className="studio-toggle-text">
        <span>{label}</span>
        {hint && <span className="studio-choice-desc">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="studio-toggle-track" aria-hidden />
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  multiline = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'url';
  multiline?: boolean;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="studio-field">
      <label htmlFor={id} className="studio-field-label">
        {label}
      </label>
      {multiline ? (
        <textarea id={id} rows={3} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <p className="studio-field-hint">{hint}</p>}
    </div>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="studio-field">
      <label htmlFor={id} className="studio-field-label">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** A collapsed section whose contents only mount (and fetch) once opened. */
export function Disclosure({ title, hint, children }: { title: string; hint?: string; children: () => ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="studio-disclosure" onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>
        <span>{title}</span>
        {hint && <span className="studio-choice-desc">{hint}</span>}
      </summary>
      {open && <div className="studio-disclosure-body">{children()}</div>}
    </details>
  );
}
