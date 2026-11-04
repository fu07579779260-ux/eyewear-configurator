import { Check } from 'lucide-react'
import { fill, useT } from '@/i18n/language'
import { cn } from '@/lib/utils'
import { DYE_COLOURS, DYE_HEX, templeColour, type DyeColour, type TempleColour } from '@/model/config'
import { useDesign } from '@/model/design-context'

/** A few frame / temple combinations to start from (temple 'same' = one colour). */
const PAIRINGS: { frame: DyeColour; temple: TempleColour }[] = [
  { frame: 'sand', temple: 'sage' },
  { frame: 'navy', temple: 'sand' },
  { frame: 'burgundy', temple: 'charcoal' },
  { frame: 'charcoal', temple: 'same' },
]

/** Light dyes need a dark tick, dark dyes a light one. */
const LIGHT: Record<DyeColour, boolean> = { sage: true, burgundy: false, sand: true, navy: false, charcoal: false }

function Swatch({ hex, same, className }: { hex: string; same?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'nylon block rounded-full',
        // "Same as frame": the frame colour inside a dashed ring
        same ? 'outline-2 outline-offset-2 outline-ink/30 outline-dashed' : 'ring-1 ring-ink/15',
        className,
      )}
      style={{ backgroundColor: hex }}
    />
  )
}

/** One row of colour choices as native radio buttons (visually hidden), for arrow-key selection. */
function ColourGroup<V extends string>({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string
  legend: string
  options: { value: V; label: string; hex: string; light: boolean; same?: boolean }[]
  value: V
  onChange: (value: V) => void
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = o.value === value
          return (
            <label
              key={o.value}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-1.5 rounded-xl px-1.5 pt-2 pb-1.5 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                selected ? 'bg-soft ring-2 ring-sage' : 'ring-1 ring-transparent hover:bg-soft/60',
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={selected}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <span className="relative">
                <Swatch hex={o.hex} same={o.same} className="size-9" />
                {selected && (
                  <Check
                    aria-hidden="true"
                    className={cn('absolute inset-0 m-auto size-4', o.light ? 'text-ink' : 'text-white')}
                    strokeWidth={3}
                  />
                )}
              </span>
              <span className="w-14 text-[0.7rem] leading-tight text-ink">{o.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Step 3: dye colours for the frame and the temples, chosen separately (PLAN.md §4.3). */
export function ColoursStep() {
  const t = useT()
  const { config, patch } = useDesign()
  const frame = config.colour.frame

  const dyes = DYE_COLOURS.map((c) => ({ value: c, label: t(`colour.${c}`), hex: DYE_HEX[c], light: LIGHT[c] }))

  return (
    <div className="space-y-5">
      <ColourGroup
        name="frame-colour"
        legend={t('colours.frame')}
        options={dyes}
        value={frame}
        onChange={(value) => patch('colour', { frame: value })}
      />
      <ColourGroup<TempleColour>
        name="temple-colour"
        legend={t('colours.temples')}
        options={[
          {
            value: 'same',
            label: t('colours.same'),
            hex: DYE_HEX[frame],
            light: LIGHT[frame],
            same: true,
          },
          ...dyes,
        ]}
        value={config.colour.temple}
        onChange={(value) => patch('colour', { temple: value })}
      />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-ink">{t('colours.pairings')}</h3>
        <div className="flex flex-wrap gap-2">
          {PAIRINGS.map((p) => {
            const templeHex = DYE_HEX[p.temple === 'same' ? p.frame : p.temple]
            const active = config.colour.frame === p.frame && templeColour(config) === (p.temple === 'same' ? p.frame : p.temple)
            return (
              <button
                key={`${p.frame}-${p.temple}`}
                type="button"
                aria-pressed={active}
                onClick={() => patch('colour', { frame: p.frame, temple: p.temple })}
                className={cn(
                  'flex items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 text-xs font-semibold transition-colors',
                  active ? 'bg-sage text-primary-foreground' : 'bg-canvas text-ink ring-1 ring-rule hover:bg-soft',
                )}
              >
                <span
                  aria-hidden="true"
                  className="nylon block size-5 rounded-full ring-1 ring-ink/15"
                  style={{ background: `linear-gradient(135deg, ${DYE_HEX[p.frame]} 50%, ${templeHex} 50%)` }}
                />
                {p.temple === 'same'
                  ? fill(t('colours.allOver'), { colour: t(`colour.${p.frame}`).toLowerCase() })
                  : `${t(`colour.${p.frame}`)} + ${t(`colour.${p.temple}`)}`}
              </button>
            )
          })}
        </div>
      </div>

      <p className="rounded-xl bg-canvas p-3 text-xs leading-relaxed text-muted ring-1 ring-rule">{t('colours.note')}</p>
    </div>
  )
}
