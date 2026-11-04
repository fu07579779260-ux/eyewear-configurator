import { useMemo } from 'react'
import type { Marks } from '@/geometry/engrave'
import { NUMBER_SIZE } from '@/geometry/engrave'
import type { EyewearConfig } from '@/model/config'
import { designCode } from '@/model/serialize'
import { textOutline } from './raster'

/** The traced outlines of the inscription and the design number. */
export function useMarks(config: EyewearConfig): Marks {
  const p = config.personal
  const code = designCode(config)
  const inscription = useMemo(
    () => (p.inscription.trim() ? textOutline(p.inscription, p.textSize) : null),
    [p.inscription, p.textSize],
  )
  const number = useMemo(() => (p.designNumber ? textOutline(code, NUMBER_SIZE, 'number') : null), [p.designNumber, code])
  return useMemo(() => ({ inscription, number }), [inscription, number])
}
