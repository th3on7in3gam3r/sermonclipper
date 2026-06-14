'use client';

import { useTranslation } from 'react-i18next';
import {
  BACKGROUND_MUSIC_TRACKS,
  CAPTION_ANIMATIONS,
  CTA_TYPES,
  DEFAULT_EXPORT_EXTRAS,
  INTRO_OUTRO_STYLES,
  type ExportExtras,
} from '@/lib/studio/exportOptions';

type Props = {
  extras: ExportExtras;
  onChange: (patch: Partial<ExportExtras>) => void;
  activeSection: 'captions' | 'audio' | 'export';
};

export default function StudioExportExtrasPanel({ extras, onChange, activeSection }: Props) {
  const { t } = useTranslation();

  if (activeSection === 'captions') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t('studio.captions.animationHint')}</p>
        {CAPTION_ANIMATIONS.map((anim) => (
          <button
            key={anim.id}
            type="button"
            onClick={() => onChange({ captionAnimation: anim.id })}
            className="glass-card"
            style={{
              padding: '14px',
              textAlign: 'left',
              borderColor: extras.captionAnimation === anim.id ? 'var(--primary)' : 'var(--card-border)',
              background: extras.captionAnimation === anim.id ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)',
            }}
          >
            <div className={anim.previewClass} style={{ fontWeight: 800, fontSize: '15px', marginBottom: '4px' }}>
              {t(`studio.captions.${anim.id}` as 'studio.captions.wordPop')}
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (activeSection === 'audio') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            checked={extras.musicEnabled}
            onChange={(e) => onChange({ musicEnabled: e.target.checked })}
          />
          {t('studio.audio.toggle')}
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            checked={extras.musicAutoMatch}
            onChange={(e) => onChange({ musicAutoMatch: e.target.checked })}
          />
          {t('studio.audio.autoMatch')}
        </label>
        <label>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('studio.audio.volume')}</span>
          <input
            type="range"
            min={0}
            max={30}
            value={Math.round(extras.musicVolume * 100)}
            onChange={(e) => onChange({ musicVolume: Number(e.target.value) / 100 })}
            style={{ width: '100%', accentColor: '#8B5CF6' }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            checked={extras.musicFade}
            onChange={(e) => onChange({ musicFade: e.target.checked })}
          />
          {t('studio.audio.fade')}
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {BACKGROUND_MUSIC_TRACKS.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => onChange({ musicTrackId: track.id, musicEnabled: true })}
              className="glass-card"
              style={{
                padding: '10px',
                fontSize: '12px',
                borderColor: extras.musicTrackId === track.id ? 'var(--primary)' : 'var(--card-border)',
              }}
            >
              <span style={{ display: 'block', fontWeight: 800 }}>{track.name}</span>
              <span style={{ opacity: 0.65, fontSize: '10px' }}>{track.category}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <section>
        <h4 style={{ fontWeight: 800, marginBottom: '12px' }}>{t('studio.cta.title')}</h4>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <input
            type="checkbox"
            checked={extras.ctaEnabled}
            onChange={(e) => onChange({ ctaEnabled: e.target.checked })}
          />
          {t('studio.cta.title')}
        </label>
        <select
          value={extras.ctaType}
          onChange={(e) => onChange({ ctaType: e.target.value as ExportExtras['ctaType'] })}
          style={{ width: '100%', marginBottom: '8px', padding: '10px', background: '#0a0a0f', color: '#fff', borderRadius: '8px' }}
        >
          {CTA_TYPES.map((c) => (
            <option key={c.id} value={c.id}>
              {t(`studio.cta.${c.id}` as 'studio.cta.subscribe')}
            </option>
          ))}
        </select>
        <input
          placeholder={t('studio.cta.customText')}
          value={extras.ctaText}
          onChange={(e) => onChange({ ctaText: e.target.value })}
          style={{ width: '100%', marginBottom: '8px', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
        />
        <input
          placeholder={t('studio.cta.customUrl')}
          value={extras.ctaUrl}
          onChange={(e) => onChange({ ctaUrl: e.target.value })}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
        />
      </section>

      <section>
        <h4 style={{ fontWeight: 800, marginBottom: '12px' }}>{t('studio.bumper.title')}</h4>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <input type="checkbox" checked={extras.includeIntro} onChange={(e) => onChange({ includeIntro: e.target.checked })} />
          {t('studio.bumper.includeIntro')}
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <input type="checkbox" checked={extras.includeOutro} onChange={(e) => onChange({ includeOutro: e.target.checked })} />
          {t('studio.bumper.includeOutro')}
        </label>
        <select
          value={extras.bumperStyle}
          onChange={(e) => onChange({ bumperStyle: e.target.value })}
          style={{ width: '100%', marginBottom: '8px', padding: '10px', background: '#0a0a0f', color: '#fff', borderRadius: '8px' }}
        >
          {INTRO_OUTRO_STYLES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {(['churchName', 'tagline', 'website', 'socialHandle'] as const).map((field) => (
          <input
            key={field}
            placeholder={t(`studio.bumper.${field}`)}
            value={extras[field]}
            onChange={(e) => onChange({ [field]: e.target.value })}
            style={{
              width: '100%',
              marginBottom: '8px',
              padding: '10px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
            }}
          />
        ))}
      </section>
    </div>
  );
}

export { DEFAULT_EXPORT_EXTRAS };
