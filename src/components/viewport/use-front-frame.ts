import { useEffect, useState } from 'react'
import type { BufferGeometry } from 'three'
import { buildFrontFrame } from '@/geometry/front'
import { loadManifold } from '@/geometry/manifold-loader'
import { fromManifold, toGeometry } from '@/geometry/manifold-mesh'
import type { EyewearConfig } from '@/model/config'

/** Wait this long after the last change before rebuilding, so dragging a slider stays smooth. */
const SETTLE_MS = 80

/**
 * The printable front frame as a preview mesh. The geometry kernel loads on
 * first use; until then (null) the viewport shows the quick stand-in frame.
 * The last frame stays on screen while the next one is built, so the view
 * doesn't flicker.
 */
export function useFrontFrame(config: EyewearConfig): BufferGeometry | null {
  const [built, setBuilt] = useState<BufferGeometry | null>(null)

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      loadManifold()
        .then((wasm) => {
          if (cancelled) return
          const { solid } = buildFrontFrame(wasm, config)
          const geometry = toGeometry(fromManifold(solid))
          solid.delete()
          setBuilt((previous) => {
            previous?.dispose()
            return geometry
          })
        })
        .catch((error) => console.error('Could not build the front frame', error))
    }, SETTLE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // Only the parts of the design that shape the front matter here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.shape, config.fit])

  // Free the last mesh when the viewport closes
  useEffect(() => () => setBuilt((previous) => (previous?.dispose(), null)), [])

  return built
}
