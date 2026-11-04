import { Pencil } from 'lucide-react'
import type { StepId } from '@/configure/steps'
import { useT } from '@/i18n/language'
import type { StringKey } from '@/i18n/strings'
import { templeColour } from '@/model/config'
import { useDesign } from '@/model/design-context'
import { designCode } from '@/model/serialize'
import { derivedSizes } from '@/model/sizes'

/**
 * Step 6: everything chosen so far on one card, each line with a link back to
 * its step. Saving and the production files follow in build steps 13–14.
 */
export function PreviewStep({ onEdit }: { onEdit: (step: StepId) => void }) {
  const t = useT()
  const { config } = useDesign()
  const sizes = derivedSizes(config)
  const temple = templeColour(config)

  const rows: { label: StringKey; value: string; step: StepId }[] = [
    { label: 'summary.shape', value: t(`shape.${config.shape.frame}`), step: 'shape' },
    { label: 'summary.size', value: `${sizes.sizeCode} · ${config.fit.frameWidth} mm`, step: 'dimensions' },
    {
      label: 'summary.colours',
      value: `${t(`colour.${config.colour.frame}`)} / ${t(`colour.${temple}`)}`,
      step: 'colours',
    },
    { label: 'summary.texture', value: t(`texture.${config.texture.type}`), step: 'texture' },
    {
      label: 'summary.inscription',
      value: config.personal.inscription || t('summary.none'),
      step: 'personal',
    },
  ]

  return (
    <div className="space-y-4">
      <dl className="divide-y divide-rule rounded-xl bg-canvas ring-1 ring-rule">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 px-3.5 py-2.5">
            <dt className="w-24 shrink-0 text-xs text-muted">{t(row.label)}</dt>
            <dd className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{row.value}</dd>
            <button
              type="button"
              onClick={() => onEdit(row.step)}
              className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-sage hover:bg-soft"
            >
              <Pencil className="size-3" aria-hidden="true" />
              {t('summary.edit')}
            </button>
          </div>
        ))}
        <div className="flex items-center gap-3 px-3.5 py-2.5">
          <dt className="w-24 shrink-0 text-xs text-muted">{t('viewport.designNumber')}</dt>
          <dd className="text-sm font-semibold text-ink tabular-nums">{designCode(config)}</dd>
        </div>
      </dl>
      <p className="rounded-xl bg-canvas p-3 text-xs leading-relaxed text-muted ring-1 ring-rule">{t('summary.later')}</p>
    </div>
  )
}
