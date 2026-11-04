import { lensSpec } from '@/geometry/lens'
import { useT } from '@/i18n/language'
import type { StringKey } from '@/i18n/strings'
import { cn } from '@/lib/utils'
import { FRAME_SHAPES, RANGES, SHAPE_LENS_HEIGHT, type FrameShape } from '@/model/config'
import { useDesign } from '@/model/design-context'
import { derivedSizes } from '@/model/sizes'
import { LensPairIcon } from './LensPairIcon'
import { NumberField } from './NumberField'

const NAME: Record<FrameShape, StringKey> = {
  round: 'shape.round',
  roundedSquare: 'shape.roundedSquare',
  catEye: 'shape.catEye',
}
const NOTE: Record<FrameShape, StringKey> = {
  round: 'shape.round.note',
  roundedSquare: 'shape.roundedSquare.note',
  catEye: 'shape.catEye.note',
}

/** Step 1: choose a frame shape, then shape its one character setting. */
export function ShapeStep() {
  const t = useT()
  const { config, patch } = useDesign()
  const { lensWidth } = derivedSizes(config)
  const current = config.shape.frame

  return (
    <div className="space-y-5">
      {/* Native radio buttons (visually hidden) give arrow-key selection for free */}
      <fieldset className="grid grid-cols-3 gap-2">
        <legend className="sr-only">{t('shape.group')}</legend>
        {FRAME_SHAPES.map((shape) => {
          const selected = shape === current
          // Each card shows its shape at the current width, with that shape's usual lens height
          const spec = {
            ...lensSpec(config, lensWidth),
            shape,
            height: selected ? config.fit.lensHeight : SHAPE_LENS_HEIGHT[shape],
          }
          return (
            <label
              key={shape}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-2 rounded-xl px-2 pt-3 pb-2.5 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                selected
                  ? 'bg-sage text-primary-foreground ring-2 ring-sage'
                  : 'bg-canvas text-ink ring-1 ring-rule hover:bg-soft',
              )}
            >
              <input
                type="radio"
                name="frame-shape"
                value={shape}
                checked={selected}
                onChange={() => patch('shape', { frame: shape })}
                className="sr-only"
              />
              <LensPairIcon spec={spec} className={cn('h-9 w-full', selected ? 'text-primary-foreground' : 'text-sage')} />
              <span className="text-sm leading-tight font-semibold">{t(NAME[shape])}</span>
            </label>
          )
        })}
      </fieldset>

      <p className="text-sm leading-relaxed text-muted">{t(NOTE[current])}</p>

      {current === 'roundedSquare' && (
        <NumberField
          label={t('field.cornerRadius')}
          value={config.shape.cornerRadius}
          range={RANGES.shape.cornerRadius}
          hint={t('field.cornerRadius.hint')}
          onChange={(cornerRadius) => patch('shape', { cornerRadius })}
        />
      )}
      {current === 'catEye' && (
        <NumberField
          label={t('field.wingLift')}
          value={config.shape.wingLift}
          range={RANGES.shape.wingLift}
          hint={t('field.wingLift.hint')}
          onChange={(wingLift) => patch('shape', { wingLift })}
        />
      )}
      {current === 'round' && <p className="text-xs leading-relaxed text-muted">{t('shape.round.hint')}</p>}

      <p className="rounded-xl bg-canvas p-3 text-xs leading-relaxed text-muted ring-1 ring-rule">{t('shape.later')}</p>
    </div>
  )
}
