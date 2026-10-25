'use client';

import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import HelpTooltip from '@/components/help/HelpTooltip';
import { HELP_TOOLTIPS } from '@/lib/helpTooltips';
import { formatTime } from '@/lib/parseTime';
import { STUDIO_ANIMATIONS, STUDIO_FILTERS, STUDIO_FONTS } from '@/lib/studio/constants';
import {
  BACKGROUND_MUSIC_TRACKS,
  CAPTION_ANIMATIONS,
  CTA_TYPES,
  INTRO_OUTRO_STYLES,
  type ExportExtras,
} from '@/lib/studio/exportOptions';
import type { StyleState } from '@/lib/studio/studioLogic';
import type { QuotableMoment } from '@/lib/quotes/extractQuotables';
import { ChoiceList, Disclosure, SelectField, TextField, Toggle } from './StudioControls';
import MarketplaceTemplatesPanel from './MarketplaceTemplatesPanel';

export type StudioSectionId = 'style' | 'caption' | 'music' | 'branding';

type TemplateOption = {
  id: string;
  name: string;
  desc: string;
  color?: string;
  textShadow?: string;
  fontStyle?: string;
};

/* --- Style ------------------------------------------------------------- */

export function StyleSection({
  style,
  templateOptions,
  isTemplateLocked,
  lockedLabel,
  onTemplate,
  onTemplateLocked,
  onFilter,
  onFont,
  onAnimation,
}: {
  style: StyleState;
  templateOptions: readonly TemplateOption[];
  isTemplateLocked: (id: string) => boolean;
  lockedLabel: string;
  onTemplate: (id: string) => void;
  onTemplateLocked: () => void;
  onFilter: (id: string) => void;
  onFont: (id: string) => void;
  onAnimation: (id: string) => void;
}) {
  return (
    <>
      <ChoiceList
        legend="Caption style"
        name="studio-template"
        value={style.template}
        onChange={onTemplate}
        onLocked={onTemplateLocked}
        choices={templateOptions.map((t) => ({
          id: t.id,
          title: t.name,
          desc: t.desc,
          lockedLabel: isTemplateLocked(t.id) ? lockedLabel : undefined,
          preview: (
            <span
              className="studio-type-swatch"
              aria-hidden
              style={{
                color: t.color || '#fff',
                textShadow: t.textShadow,
                fontStyle: (t.fontStyle as 'normal' | 'italic') || 'normal',
              }}
            >
              Aa
            </span>
          ),
        }))}
      />

      <Disclosure title="More styles from the community" hint="Free and paid caption styles made by other churches">
        {() => <MarketplaceTemplatesPanel selectedTemplate={style.template} onSelect={onTemplate} />}
      </Disclosure>

      <ChoiceList
        legend="Color"
        name="studio-filter"
        value={style.filter}
        onChange={onFilter}
        layout="tiles"
        choices={STUDIO_FILTERS.map((f) => ({
          id: f.id,
          title: f.name,
          preview: (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="studio-filter-sample"
              src="/studio/filter-sample.webp"
              alt=""
              width={150}
              height={100}
              loading="lazy"
              style={{ filter: f.css === 'none' ? undefined : f.css }}
            />
          ),
        }))}
      />

      <ChoiceList
        legend="Font"
        name="studio-font"
        value={style.font}
        onChange={onFont}
        choices={STUDIO_FONTS.map((f) => ({
          id: f.id,
          title: f.name,
          desc: f.desc,
          titleStyle: { fontFamily: f.family, fontWeight: f.weight },
        }))}
      />

      <ChoiceList
        legend="How the text appears"
        name="studio-animation"
        value={style.animation}
        onChange={onAnimation}
        choices={STUDIO_ANIMATIONS.map((a) => ({ id: a.id, title: a.name, desc: a.desc }))}
      />
    </>
  );
}

/* --- Caption ----------------------------------------------------------- */

export function CaptionSection({
  caption,
  captionOrigin,
  onCaption,
  extras,
  onExtras,
  quotes,
  onPreviewQuote,
  onQuoteCard,
}: {
  caption: string;
  /** Where the current caption came from: Vesper's suggestion, the clip's quote, or the user. */
  captionOrigin: 'ai' | 'quote' | 'edited';
  onCaption: (value: string) => void;
  extras: ExportExtras;
  onExtras: (patch: Partial<ExportExtras>) => void;
  quotes: QuotableMoment[];
  onPreviewQuote: (seconds: number) => void;
  onQuoteCard?: (quote: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <TextField
        label="Caption on the reel"
        multiline
        value={caption}
        onChange={onCaption}
        hint={
          <>
            Burned into the video when you export.
            {captionOrigin === 'ai' && ' Vesper suggested this from the sermon.'}
            {captionOrigin === 'quote' && ' Started from the clip’s quote.'}
            <HelpTooltip content={HELP_TOOLTIPS.burnCaptions} label="About burned-in captions" />
          </>
        }
      />

      <ChoiceList
        legend={t('studio.captions.animationStyle')}
        name="studio-caption-animation"
        value={extras.captionAnimation}
        onChange={(id) => onExtras({ captionAnimation: id as ExportExtras['captionAnimation'] })}
        choices={CAPTION_ANIMATIONS.map((a) => ({
          id: a.id,
          title: t(`studio.captions.${a.id}` as 'studio.captions.wordPop'),
        }))}
      />

      <section className="studio-group" aria-labelledby="studio-quotes-title">
        <h3 id="studio-quotes-title" className="studio-group-title">
          Quotable lines from this sermon
        </h3>
        {quotes.length === 0 ? (
          <p className="studio-muted">No standout lines were found in this sermon.</p>
        ) : (
          <ul className="studio-quotes">
            {quotes.map((q, i) => (
              <li key={`${i}-${q.text.slice(0, 16)}`} className="studio-quote">
                <blockquote>&ldquo;{q.text}&rdquo;</blockquote>
                <div className="studio-quote-actions">
                  <button
                    type="button"
                    className="studio-link-btn"
                    onClick={() => {
                      onPreviewQuote(q.timestampSeconds);
                      toast.success(`Previewing from ${formatTime(q.timestampSeconds)}`);
                    }}
                  >
                    Preview at {formatTime(q.timestampSeconds)}
                  </button>
                  <button type="button" className="studio-link-btn" onClick={() => onCaption(q.text)}>
                    Use as caption
                  </button>
                  {onQuoteCard && (
                    <button type="button" className="studio-link-btn" onClick={() => onQuoteCard(q.text)}>
                      Make a quote card
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

/* --- Music ------------------------------------------------------------- */

export function MusicSection({ extras, onExtras }: { extras: ExportExtras; onExtras: (patch: Partial<ExportExtras>) => void }) {
  const { t } = useTranslation();
  return (
    <>
      <Toggle
        label="Background music"
        hint="Plays quietly under the sermon audio."
        checked={extras.musicEnabled}
        onChange={(musicEnabled) => onExtras({ musicEnabled })}
      />
      <fieldset className="studio-group" disabled={!extras.musicEnabled}>
        <Toggle
          label={t('studio.audio.autoMatch')}
          hint="Lets Vesper pick a track that suits the clip’s tone."
          checked={extras.musicAutoMatch}
          onChange={(musicAutoMatch) => onExtras({ musicAutoMatch })}
        />
        {!extras.musicAutoMatch && (
          <ChoiceList
            legend="Track"
            name="studio-track"
            value={extras.musicTrackId}
            onChange={(musicTrackId) => onExtras({ musicTrackId })}
            choices={BACKGROUND_MUSIC_TRACKS.map((track) => ({
              id: track.id,
              title: track.name,
              desc: t(`studio.audio.categories.${track.category}` as 'studio.audio.categories.calm'),
            }))}
          />
        )}
        <div className="studio-field">
          <label className="studio-field-label" htmlFor="studio-music-volume">
            {t('studio.audio.volume')} <span className="studio-muted">{Math.round(extras.musicVolume * 100)}%</span>
          </label>
          <input
            id="studio-music-volume"
            type="range"
            min={0}
            max={30}
            value={Math.round(extras.musicVolume * 100)}
            onChange={(e) => onExtras({ musicVolume: Number(e.target.value) / 100 })}
          />
        </div>
        <Toggle label={t('studio.audio.fade')} checked={extras.musicFade} onChange={(musicFade) => onExtras({ musicFade })} />
      </fieldset>
    </>
  );
}

/* --- Branding ---------------------------------------------------------- */

export function BrandingSection({
  extras,
  onExtras,
}: {
  extras: ExportExtras;
  onExtras: (patch: Partial<ExportExtras>) => void;
}) {
  const { t } = useTranslation();
  const ctaDefault = CTA_TYPES.find((c) => c.id === extras.ctaType)?.defaultText || '';
  return (
    <>
      <section className="studio-group" aria-labelledby="studio-cta-title">
        <h3 id="studio-cta-title" className="studio-group-title">
          Call to action
        </h3>
        <Toggle
          label="Show a call to action"
          hint="A line of text over the last four seconds of the reel."
          checked={extras.ctaEnabled}
          onChange={(ctaEnabled) => onExtras({ ctaEnabled })}
        />
        {extras.ctaEnabled && (
          <>
            <SelectField
              label="What should viewers do?"
              value={extras.ctaType}
              onChange={(v) => onExtras({ ctaType: v as ExportExtras['ctaType'] })}
              options={CTA_TYPES.map((c) => ({ id: c.id, label: t(`studio.cta.${c.id}` as 'studio.cta.subscribe') }))}
            />
            <TextField
              label="Text"
              value={extras.ctaText}
              onChange={(ctaText) => onExtras({ ctaText })}
              placeholder={ctaDefault || 'Learn more'}
              hint={extras.ctaType !== 'custom' && !extras.ctaText ? 'Leave blank to use the suggested text.' : undefined}
            />
          </>
        )}
      </section>

      <section className="studio-group" aria-labelledby="studio-bumper-title">
        <h3 id="studio-bumper-title" className="studio-group-title">
          {t('studio.bumper.title')}
        </h3>
        <Toggle
          label={t('studio.bumper.includeIntro')}
          checked={extras.includeIntro}
          onChange={(includeIntro) => onExtras({ includeIntro })}
        />
        <Toggle
          label={t('studio.bumper.includeOutro')}
          checked={extras.includeOutro}
          onChange={(includeOutro) => onExtras({ includeOutro })}
        />
        {(extras.includeIntro || extras.includeOutro) && (
          <SelectField
            label="Look"
            value={extras.bumperStyle}
            onChange={(bumperStyle) => onExtras({ bumperStyle })}
            options={INTRO_OUTRO_STYLES.map((s) => ({ id: s.id, label: s.name }))}
          />
        )}
      </section>

      <section className="studio-group" aria-labelledby="studio-church-title">
        <h3 id="studio-church-title" className="studio-group-title">
          Your church
        </h3>
        <p className="studio-muted">
          Your church name and tagline appear on the intro; your website and handle appear on the outro.
        </p>
        {(['churchName', 'tagline', 'website', 'socialHandle'] as const).map((field) => (
          <TextField
            key={field}
            label={t(`studio.bumper.${field}`)}
            type={field === 'website' ? 'url' : 'text'}
            value={extras[field]}
            onChange={(v) => onExtras({ [field]: v })}
          />
        ))}
      </section>
    </>
  );
}
