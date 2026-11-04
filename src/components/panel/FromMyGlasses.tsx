import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { fill, useT } from '@/i18n/language'
import { useDesign } from '@/model/design-context'
import { designReducer } from '@/model/reducer'
import { derivedSizes, parseSizeCode } from '@/model/sizes'

type Result =
  | { kind: 'idle' }
  | { kind: 'error'; message: 'unreadable' | 'out-of-range' }
  | { kind: 'done'; entered: string; result: string; adjusted: boolean }

/** e.g. 52 → "52", 49.5 → "49.5" */
const show = (n: number) => String(Math.round(n * 10) / 10)

/**
 * Fill the fit from the size code printed inside the temple of the user's
 * own glasses, e.g. 52□18-145 (PLAN.md §4.2).
 */
export function FromMyGlasses() {
  const t = useT()
  const { config, fromGlasses } = useDesign()
  const [text, setText] = useState('')
  const [result, setResult] = useState<Result>({ kind: 'idle' })
  const id = useId()

  const apply = () => {
    const parsed = parseSizeCode(text)
    if (!parsed.ok) {
      setResult({ kind: 'error', message: parsed.error })
      return
    }
    const { lensWidth, bridge, templeLength } = parsed.value
    const entered = `${show(lensWidth)}□${show(bridge)}-${show(templeLength)}`
    // Work out what the design will become, to tell the user if any value had to be adjusted
    const next = designReducer(config, { type: 'fromGlasses', measurement: parsed.value })
    const code = derivedSizes(next).sizeCode
    fromGlasses(parsed.value)
    setResult({ kind: 'done', entered, result: code, adjusted: code !== entered })
  }

  return (
    <div className="space-y-2 rounded-xl bg-canvas p-3.5 ring-1 ring-rule">
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {t('glasses.title')}
      </label>
      <p className="text-xs leading-relaxed text-muted">{t('glasses.help')}</p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          apply()
        }}
      >
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="52□18-145"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (result.kind === 'error') setResult({ kind: 'idle' })
          }}
          aria-describedby={`${id}-result`}
          className="min-w-0 flex-1 rounded-lg bg-surface px-3 py-2 text-sm text-ink tabular-nums ring-1 ring-rule placeholder:text-muted/70 focus:ring-sage"
        />
        <Button type="submit" variant="secondary" className="rounded-lg" disabled={!text.trim()}>
          {t('glasses.apply')}
        </Button>
      </form>
      <p id={`${id}-result`} role="status" className="min-h-4 text-xs leading-relaxed">
        {result.kind === 'error' && <span className="text-warn">{t(`glasses.error.${result.message}`)}</span>}
        {/* Only while the fit still matches: after a hand edit the message would no longer be true */}
        {result.kind === 'done' && derivedSizes(config).sizeCode === result.result && (
          <span className="text-sage">
            {result.adjusted
              ? fill(t('glasses.adjusted'), { entered: result.entered, result: result.result })
              : fill(t('glasses.done'), { result: result.result })}
          </span>
        )}
      </p>
    </div>
  )
}
