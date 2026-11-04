import { useId } from 'react'
import { placeMarks } from '@/geometry/engrave'
import { EAR_BEND, HINGE_ZONE } from '@/geometry/temple'
import { textureZone } from '@/geometry/texture'
import { fill, useT } from '@/i18n/language'
import { cn } from '@/lib/utils'
import { MAX_INSCRIPTION_LENGTH, PLACEMENTS, RANGES } from '@/model/config'
import { useDesign } from '@/model/design-context'
import { cleanInscription } from '@/model/sanitize'
import { designCode } from '@/model/serialize'
import { useMarks } from '@/personal/use-marks'
import { CheckNote } from './CheckNote'
import { NumberField } from './NumberField'

/** Step 5: initials or a short inscription inside the temples, and the design number (PLAN.md §4.5). */
export function PersonalStep() {
  const t = useT()
  const { config, patch } = useDesign()
  const p = config.personal
  const id = useId()
  const marks = useMarks(config)
  const length = Array.from(p.inscription).length

  // Tell the user when a mark had to be made smaller to fit the temple
  const zone = textureZone(config, HINGE_ZONE, EAR_BEND)
  const scaled = (['right', 'left'] as const).some((side) => placeMarks(config, side, marks, zone).some((m) => m.scaled))

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={id} className="text-sm font-semibold text-ink">
            {t('personal.inscription')}
          </label>
          <span className="text-xs text-muted tabular-nums" aria-live="polite">
            {length} / {MAX_INSCRIPTION_LENGTH}
          </span>
        </div>
        <input
          id={id}
          type="text"
          value={p.inscription}
          placeholder={t('personal.placeholder')}
          onChange={(e) => patch('personal', { inscription: cleanInscription(e.target.value) })}
          className="w-full rounded-lg bg-canvas px-3 py-2 text-sm text-ink ring-1 ring-rule placeholder:text-muted/70 focus:ring-sage"
        />
        <p className="text-xs leading-relaxed text-muted">{t('personal.inscription.hint')}</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-ink">{t('personal.placement')}</legend>
        <div className="flex gap-2">
          {PLACEMENTS.map((placement) => (
            <label
              key={placement}
              className={cn(
                'flex-1 cursor-pointer rounded-full px-3 py-1.5 text-center text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
                p.placement === placement
                  ? 'bg-sage font-semibold text-primary-foreground'
                  : 'bg-canvas text-ink ring-1 ring-rule hover:bg-soft',
              )}
            >
              <input
                type="radio"
                name="inscription-placement"
                value={placement}
                checked={p.placement === placement}
                onChange={() => patch('personal', { placement })}
                className="sr-only"
              />
              {t(`personal.placement.${placement}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <NumberField
        label={t('field.textSize')}
        hint={t('field.textSize.hint')}
        value={p.textSize}
        range={RANGES.personal.textSize}
        onChange={(textSize) => patch('personal', { textSize })}
      />
      <CheckNote config={config} id="textSize" />
      <NumberField
        label={t('field.engravingDepth')}
        hint={t('field.engravingDepth.hint')}
        value={p.engravingDepth}
        range={RANGES.personal.engravingDepth}
        onChange={(engravingDepth) => patch('personal', { engravingDepth })}
      />
      {scaled && (
        <p role="status" className="rounded-xl bg-warn/8 p-3 text-xs leading-relaxed text-warn ring-1 ring-warn/30">
          {t('personal.scaled')}
        </p>
      )}

      <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-canvas p-3 ring-1 ring-rule">
        <input
          type="checkbox"
          checked={p.designNumber}
          onChange={(e) => patch('personal', { designNumber: e.target.checked })}
          className="mt-0.5 size-4 accent-sage"
        />
        <span>
          <span className="block text-sm font-semibold text-ink">{t('personal.designNumber')}</span>
          <span className="block text-xs leading-relaxed text-muted">
            {fill(t('personal.designNumber.hint'), { code: designCode(config) })}
          </span>
        </span>
      </label>

      <p className="rounded-xl bg-canvas p-3 text-xs leading-relaxed text-muted ring-1 ring-rule">{t('personal.fonts')}</p>
    </div>
  )
}
