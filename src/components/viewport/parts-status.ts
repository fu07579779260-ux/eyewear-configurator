import { useSyncExternalStore } from 'react'
import type { Manifold } from 'manifold-3d'

// Whether the last built printed parts are sound: each one watertight
// (manifold) and in one piece. Written by the viewport when it builds the
// parts, read by the print check in the panel.

export type PartId = 'front' | 'templeRight' | 'templeLeft'

export interface PartsStatus {
  /** null until the geometry kernel has built the parts once */
  checked: boolean
  /** Parts that are not one watertight piece */
  broken: PartId[]
}

let status: PartsStatus = { checked: false, broken: [] }
const listeners = new Set<() => void>()

export function setPartsStatus(next: PartsStatus) {
  status = next
  for (const listener of listeners) listener()
}

export function usePartsStatus(): PartsStatus {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => status,
  )
}

/** One watertight piece: no mesh errors and a single connected body. */
export function isSound(solid: Manifold): boolean {
  if (solid.status() !== 'NoError' || solid.isEmpty()) return false
  const pieces = solid.decompose()
  const one = pieces.length === 1
  for (const piece of pieces) piece.delete()
  return one
}
