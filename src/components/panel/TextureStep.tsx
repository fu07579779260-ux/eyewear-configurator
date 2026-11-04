import { Shuffle } from 'lucide-react'
import { fill, useT } from '@/i18n/language'
import { cn } from '@/lib/utils'
import { RANGES, RIB_DIRECTIONS, TEXTURES, type Texture } from '@/model/config'
import { useDesign } from '@/model/design-context'
import { CheckNote } from './CheckNote'
import { NumberField } from './NumberField'

/** Small side views of a temple showing each texture. */
function TextureIcon({ texture, className }: { texture: Texture; className?: string }) {
  return (
    <svg viewBox="0 0 64 20" className={className} aria-hidden="true">
      <path d="M2 6h46c6 0 9 3 12 10" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" opacity="0.35" />
      {texture === 'ribbed' &&
        Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={14 + i * 3.6} y1="3.5" x2={14 + i * 3.6} y2="8.5" stroke="currentColor" strokeWidth="1.3" />
        ))}
      {texture === 'perforated' &&
        [
          [16, 5, 1.8],
          [21.5, 7, 1.5],
          [26, 4.6, 1.6],
          [31, 7.2, 1.7],
          [36, 4.8, 1.5],
          [41, 6.6, 1.8],
        ].map(([cx, cy, r]) => <ellipse key={cx} cx={cx} cy={cy} rx={r * 1.15} ry={r} fill="currentColor" />)}
    </svg>
  )
}

/** Step 4: the temple texture, on the outer face only (PLAN.md §4.4). */
export function TextureStep() {
  const t = useT()
  const { config, patch, newPattern } = useDesign()
  const { texture } = config

  return (
    <div className="space-y-5">
      <fieldset className="grid grid-cols-3 gap-2">
        <legend className="sr-only">{t('texture.group')}</legend>
        {TEXTURES.map((type) => {
          const selected = texture.type === type
          return (
            <label
              key={type}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-2 rounded-xl px-2 pt-3 pb-2.5 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                selected ? 'bg-sage text-primary-foreground ring-2 ring-sage' : 'bg-canvas text-ink ring-1 ring-rule hover:bg-soft',
              )}
            >
              <input
                type="radio"
                name="temple-texture"
                value={type}
                checked={selected}
                onChange={() => patch('texture', { type })}
                className="sr-only"
              />
              <TextureIcon texture={type} className={cn('h-6 w-full', selected ? 'text-primary-foreground' : 'text-sage')} />
              <span className="text-sm leading-tight font-semibold">{t(`texture.${type}`)}</span>
            </label>
          )
        })}
      </fieldset>

      <p className="text-sm leading-relaxed text-muted">{t(`texture.${texture.type}.note`)}</p>

      {texture.type === 'ribbed' && (
        <div className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-ink">{t('texture.direction')}</legend>
            <div className="flex gap-2">
              {RIB_DIRECTIONS.map((ribDirection) => (
                <label
                  key={ribDirection}
                  className={cn(
                    'flex-1 cursor-pointer rounded-full px-3 py-1.5 text-center text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
                    texture.ribDirection === ribDirection
                      ? 'bg-sage font-semibold text-primary-foreground'
                      : 'bg-canvas text-ink ring-1 ring-rule hover:bg-soft',
                  )}
                >
                  <input
                    type="radio"
                    name="rib-direction"
                    value={ribDirection}
                    checked={texture.ribDirection === ribDirection}
                    onChange={() => patch('texture', { ribDirection })}
                    className="sr-only"
                  />
                  {t(`texture.direction.${ribDirection}`)}
                </label>
              ))}
            </div>
          </fieldset>
          <NumberField
            label={t('field.ribPitch')}
            hint={t('field.ribPitch.hint')}
            value={texture.ribPitch}
            range={RANGES.texture.ribPitch}
            onChange={(ribPitch) => patch('texture', { ribPitch })}
          />
          <NumberField
            label={t('field.ribDepth')}
            hint={t('field.ribDepth.hint')}
            value={texture.ribDepth}
            range={RANGES.texture.ribDepth}
            onChange={(ribDepth) => patch('texture', { ribDepth })}
          />
          <CheckNote config={config} id="ribs" />
        </div>
      )}

      {texture.type === 'perforated' && (
        <div className="space-y-4">
          <NumberField
            label={t('field.holeDensity')}
            hint={t('field.holeDensity.hint')}
            value={Math.round(texture.holeDensity * 100)}
            range={{ min: 0, max: 100, step: 5 }}
            unit="%"
            onChange={(percent) => patch('texture', { holeDensity: percent / 100 })}
          />
          <div className="flex items-center justify-between gap-3 rounded-xl bg-canvas p-3 ring-1 ring-rule">
            <p className="text-xs text-muted">{fill(t('texture.pattern'), { seed: String(texture.seed) })}</p>
            <button
              type="button"
              onClick={newPattern}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-rule hover:bg-soft"
            >
              <Shuffle className="size-3.5" aria-hidden="true" />
              {t('texture.newPattern')}
            </button>
          </div>
          <CheckNote config={config} id="pockets" />
        </div>
      )}

      <p className="rounded-xl bg-canvas p-3 text-xs leading-relaxed text-muted ring-1 ring-rule">{t('texture.zones')}</p>
    </div>
  )
}
