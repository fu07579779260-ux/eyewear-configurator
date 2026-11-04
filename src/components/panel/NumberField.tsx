import { useEffect, useId, useState } from 'react'
import type { NumberRange } from '@/model/config'
import { clampToRange } from '@/model/sanitize'

/** Decimals to show for a step, e.g. 0.5 → 1, 0.05 → 2, 5 → 0. */
const decimals = (step: number) => (String(step).split('.')[1] ?? '').length

/**
 * A slider with a number box next to it (PLAN.md §4: every slider has a
 * number input). The number box accepts typing freely and applies the value,
 * clamped to the range, when it is valid or when the field loses focus.
 */
export function NumberField({
  label,
  value,
  range,
  unit = 'mm',
  hint,
  onChange,
}: {
  label: string
  value: number
  range: NumberRange
  unit?: string
  hint?: string
  onChange: (value: number) => void
}) {
  const id = useId()
  const digits = decimals(range.step)
  const shown = value.toFixed(digits)
  const [draft, setDraft] = useState(shown)
  // Follow outside changes (another control, a loaded design) unless the user is mid-typing
  useEffect(() => setDraft(shown), [shown])

  const commit = (text: string) => {
    const n = Number(text.replace(',', '.'))
    if (Number.isFinite(n) && text.trim() !== '') onChange(clampToRange(n, range))
    else setDraft(shown)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
        <span className="flex items-center gap-1 text-sm text-muted">
          <input
            type="text"
            inputMode="decimal"
            aria-label={`${label} (${unit})`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit(e.currentTarget.value)
            }}
            className="h-9 w-16 rounded-md bg-canvas px-2 text-right text-ink tabular-nums ring-1 ring-rule focus:ring-sage"
          />
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={(e) => onChange(clampToRange(Number(e.target.value), range))}
        className="h-8 w-full cursor-pointer accent-sage"
      />
      <div className="flex justify-between text-[0.7rem] text-muted tabular-nums" aria-hidden="true">
        <span>{range.min.toFixed(digits)}</span>
        <span>{range.max.toFixed(digits)}</span>
      </div>
      {hint && <p className="text-xs leading-relaxed text-muted">{hint}</p>}
    </div>
  )
}
