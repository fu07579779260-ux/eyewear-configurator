import { CircleCheck, LoaderCircle, TriangleAlert } from 'lucide-react'
import { usePartsStatus } from '@/components/viewport/parts-status'
import { printChecks } from '@/geometry/checks'
import { fill, useT } from '@/i18n/language'
import { cn } from '@/lib/utils'
import type { EyewearConfig } from '@/model/config'

/** One line of the print check: a tick or a warning, with the reason and how to fix it. */
function Row({ ok, text, fix }: { ok: boolean; text: string; fix?: string }) {
  return (
    <li className="flex gap-2.5 px-3.5 py-2.5">
      {ok ? (
        <CircleCheck className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden="true" />
      ) : (
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
      )}
      <span className="min-w-0 text-xs leading-relaxed">
        <span className={cn(ok ? 'text-ink' : 'font-semibold text-warn')}>{text}</span>
        {fix && <span className="block text-muted">{fix}</span>}
      </span>
    </li>
  )
}

/**
 * The design measured against the SLS PA12 rules (PLAN.md §5): warnings, not
 * blocks. Problems are listed first; the passed checks follow, so users can
 * see what was checked.
 */
export function PrintCheck({ config }: { config: EyewearConfig }) {
  const t = useT()
  const parts = usePartsStatus()
  const checks = printChecks(config).sort((a, b) => Number(a.ok) - Number(b.ok))
  const warnings = checks.filter((c) => !c.ok).length + parts.broken.length

  return (
    <section aria-labelledby="print-check-title" className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="print-check-title" className="text-sm font-semibold text-ink">
          {t('check.title')}
        </h3>
        <span className={cn('text-xs font-semibold', warnings ? 'text-warn' : 'text-sage')}>
          {warnings ? fill(t('check.warnings'), { count: String(warnings) }) : t('check.allGood')}
        </span>
      </div>
      <ul className="divide-y divide-rule rounded-xl bg-canvas ring-1 ring-rule">
        {checks.map((c) => (
          <Row
            key={c.id}
            ok={c.ok}
            text={fill(t(`check.${c.id}.${c.ok ? 'ok' : 'warn'}`), c.values)}
            fix={c.ok ? undefined : fill(t(`check.${c.id}.fix`), c.values)}
          />
        ))}
        {parts.checked ? (
          <Row
            ok={!parts.broken.length}
            text={parts.broken.length ? t('check.solid.warn') : t('check.solid.ok')}
            fix={parts.broken.length ? t('check.solid.fix') : undefined}
          />
        ) : (
          <li className="flex gap-2.5 px-3.5 py-2.5 text-xs text-muted">
            <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden="true" />
            {t('check.solid.pending')}
          </li>
        )}
      </ul>
      <p className="text-xs leading-relaxed text-muted">{t('check.note')}</p>
    </section>
  )
}
