import { useEffect, useState } from 'react'
import type { BufferGeometry } from 'three'
import { buildFrontFrame } from '@/geometry/front'
import { loadManifold } from '@/geometry/manifold-loader'
import { fromManifold, toGeometry } from '@/geometry/manifold-mesh'
import { buildTemple } from '@/geometry/temple'
import type { EyewearConfig } from '@/model/config'

/** Wait this long after the last change before rebuilding, so dragging a slider stays smooth. */
const SETTLE_MS = 80

export interface PrintedParts {
  front: BufferGeometry
  /** The right temple in its print frame; the left one is shown mirrored */
  temple: BufferGeometry
}

/**
 * The printable front frame and temple as preview meshes. The geometry
 * kernel loads on first use; until then (null) the viewport shows the quick
 * stand-in parts. The last parts stay on screen while the next ones are
 * built, so the view doesn't flicker.
 */
export function usePrintedParts(config: EyewearConfig): PrintedParts | null {
  const [built, setBuilt] = useState<PrintedParts | null>(null)

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      loadManifold()
        .then((wasm) => {
          if (cancelled) return
          const { solid } = buildFrontFrame(wasm, config)
          const front = toGeometry(fromManifold(solid))
          solid.delete()
          const templeSolid = buildTemple(wasm, config)
          const temple = toGeometry(fromManifold(templeSolid))
          templeSolid.delete()
          setBuilt((previous) => {
            previous?.front.dispose()
            previous?.temple.dispose()
            return { front, temple }
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
  }, [config.shape, config.fit, config.texture])

  // Free the last meshes when the viewport closes
  useEffect(
    () => () =>
      setBuilt((previous) => {
        previous?.front.dispose()
        previous?.temple.dispose()
        return null
      }),
    [],
  )

  return built
}
