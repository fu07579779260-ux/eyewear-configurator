import { useEffect, useState } from 'react'
import type { BufferGeometry } from 'three'
import { buildFrontFrame } from '@/geometry/front'
import { loadManifold } from '@/geometry/manifold-loader'
import { fromManifold, toGeometry } from '@/geometry/manifold-mesh'
import type { Marks } from '@/geometry/engrave'
import { buildTemple } from '@/geometry/temple'
import type { EyewearConfig } from '@/model/config'
import { isSound, setPartsStatus, type PartId } from './parts-status'

/** Wait this long after the last change before rebuilding, so dragging a slider stays smooth. */
const SETTLE_MS = 80

function disposeParts(parts: PrintedParts) {
  parts.front.dispose()
  parts.temple.dispose()
  parts.templeLeft.dispose()
}

export interface PrintedParts {
  front: BufferGeometry
  /** The temples in their print frame; the left one is shown mirrored. They differ only in their engravings. */
  temple: BufferGeometry
  templeLeft: BufferGeometry
}

/**
 * The printable front frame and temple as preview meshes. The geometry
 * kernel loads on first use; until then (null) the viewport shows the quick
 * stand-in parts. The last parts stay on screen while the next ones are
 * built, so the view doesn't flicker.
 */
export function usePrintedParts(config: EyewearConfig, marks: Marks): PrintedParts | null {
  const [built, setBuilt] = useState<PrintedParts | null>(null)

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      loadManifold()
        .then((wasm) => {
          if (cancelled) return
          const broken: PartId[] = []
          const { solid } = buildFrontFrame(wasm, config)
          if (!isSound(solid)) broken.push('front')
          const front = toGeometry(fromManifold(solid))
          solid.delete()
          const templeOf = (side: 'right' | 'left') => {
            const solid = buildTemple(wasm, config, side, marks)
            if (!isSound(solid)) broken.push(side === 'right' ? 'templeRight' : 'templeLeft')
            const geometry = toGeometry(fromManifold(solid))
            solid.delete()
            return geometry
          }
          const temple = templeOf('right')
          const templeLeft = templeOf('left')
          setPartsStatus({ checked: true, broken })
          setBuilt((previous) => {
            if (previous) disposeParts(previous)
            return { front, temple, templeLeft }
          })
        })
        .catch((error) => console.error('Could not build the printed parts', error))
    }, SETTLE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // Only the parts of the design that shape the printed parts matter here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.shape, config.fit, config.texture, config.personal, marks])

  // Free the last meshes when the viewport closes
  useEffect(
    () => () =>
      setBuilt((previous) => {
        if (previous) disposeParts(previous)
        return null
      }),
    [],
  )

  return built
}
