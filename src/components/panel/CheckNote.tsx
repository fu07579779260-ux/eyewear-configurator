import { TriangleAlert } from 'lucide-react'
import { printChecks, type CheckId } from '@/geometry/checks'
import { fill, useT } from '@/i18n/language'
import type { EyewearConfig } from '@/model/config'

/** A print check shown right next to the setting that causes it, only when it needs attention. */
export function CheckNote({ config, id }: { config: EyewearConfig; id: CheckId }) {
  const t = useT()
  const check = printChecks(config).find((c) => c.id === id)
  if (!check || check.ok) return null
  return (
    <p role="status" className="flex gap-2 rounded-xl bg-warn/8 p-3 text-xs leading-relaxed text-warn ring-1 ring-warn/30">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>
        <span className="font-semibold">{fill(t(`check.${id}.warn`), check.values)}</span>{' '}
        {fill(t(`check.${id}.fix`), check.values)}
      </span>
    </p>
  )
}
