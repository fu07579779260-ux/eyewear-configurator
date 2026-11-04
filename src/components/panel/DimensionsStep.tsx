import { TriangleAlert } from 'lucide-react'
import { fill, useT } from '@/i18n/language'
import { RANGES, type EyewearConfig } from '@/model/config'
import { useDesign } from '@/model/design-context'
import { derivedSizes, LENS_WIDTH_RANGE } from '@/model/sizes'
import { FromMyGlasses } from './FromMyGlasses'
import { NumberField } from './NumberField'

type FitKey = keyof EyewearConfig['fit']

const MAIN: FitKey[] = ['frameWidth', 'bridge', 'templeLength']
const MORE: FitKey[] = ['lensHeight', 'frontThickness', 'rimWidth', 'templeWidth']

/** Step 2: set the fit, by hand or from the user's own glasses. */
export function DimensionsStep() {
  const t = useT()
  const { config, patch } = useDesign()
  const sizes = derivedSizes(config)

  const field = (key: FitKey) => (
    <NumberField
      key={key}
      label={t(`field.${key}`)}
      hint={t(`field.${key}.hint`)}
      value={config.fit[key]}
      range={RANGES.fit[key]}
      onChange={(value) => patch('fit', { [key]: value })}
    />
  )

  return (
    <div className="space-y-5">
      <FromMyGlasses />

      <div className="space-y-4">{MAIN.map(field)}</div>

      {/* What the three main values mean for the lens, in the form printed on real frames */}
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-canvas p-3 ring-1 ring-rule">
          <dt className="text-xs text-muted">{t('fit.lensWidth')}</dt>
          <dd className="mt-0.5 font-semibold text-ink tabular-nums">{sizes.lensWidth.toFixed(1)} mm</dd>
        </div>
        <div className="rounded-xl bg-canvas p-3 ring-1 ring-rule">
          <dt className="text-xs text-muted">{t('fit.sizeCode')}</dt>
          <dd className="mt-0.5 font-semibold text-ink tabular-nums">{sizes.sizeCode}</dd>
        </div>
      </dl>
      {!sizes.lensWidthOk && (
        <p role="alert" className="flex gap-2 rounded-xl bg-warn/8 p-3 text-xs leading-relaxed text-warn ring-1 ring-warn/30">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {fill(t(sizes.lensWidth < LENS_WIDTH_RANGE.min ? 'fit.lensTooNarrow' : 'fit.lensTooWide'), {
            width: sizes.lensWidth.toFixed(1),
            min: String(LENS_WIDTH_RANGE.min),
            max: String(LENS_WIDTH_RANGE.max),
          })}
        </p>
      )}

      <details className="group rounded-xl bg-canvas ring-1 ring-rule">
        <summary className="cursor-pointer list-none px-3.5 py-3 text-sm font-semibold text-ink">
          <span className="mr-1.5 inline-block transition-transform group-open:rotate-90" aria-hidden="true">
            ›
          </span>
          {t('fit.more')}
        </summary>
        <div className="space-y-4 px-3.5 pb-4">{MORE.map(field)}</div>
      </details>

      <p className="text-xs leading-relaxed text-muted">{t('fit.prototype')}</p>
    </div>
  )
}
