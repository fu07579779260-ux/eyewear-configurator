import type { CrossSection, ManifoldToplevel } from 'manifold-3d'
import type { EyewearConfig } from '@/model/config'
import { EDGE_MARGIN } from './texture'
import type { Outline } from './trace'

// Personal details engraved on the INSIDE of the temples (PLAN.md §4.5,
// §9 step 11): the inscription, and the design number inside the right
// temple. In the temple's print frame (see temple.ts) the inner face is at
// Z = 0, X runs along the temple from the hinge end, Y is up.
//
// Engravings sit on the straight part, after the hinge zone, and are scaled
// down if they would not fit the height or length there. Text is laid out so
// that it reads the right way round when you look at the inside of the
// temple from between the temples.

export interface Marks {
  inscription: Outline | null
  /** The design number, already set in type */
  number: Outline | null
}

export type Side = 'right' | 'left'

/** Cap height of the design number, in mm. */
export const NUMBER_SIZE = 2
/** Depth of the design number. */
export const NUMBER_DEPTH = 0.4
/** Engravings start this far behind the hinge zone. */
const START_GAP = 2
/** Space between the inscription and the design number. */
const MARK_GAP = 4

export interface PlacedMark {
  outline: Outline
  depth: number
  kind: 'inscription' | 'number'
  /** The mark had to be made smaller to fit */
  scaled: boolean
}

function bounds(o: Outline) {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const loop of o) {
    for (const [x, y] of loop) {
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
  }
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY }
}

/** Which marks go on this temple. */
export function marksFor(config: EyewearConfig, side: Side, marks: Marks): { outline: Outline; kind: PlacedMark['kind']; depth: number }[] {
  const p = config.personal
  const items: { outline: Outline; kind: PlacedMark['kind']; depth: number }[] = []
  const onThisSide = p.placement === 'both' || p.placement === side
  if (marks.inscription?.length && p.inscription.trim() && onThisSide) {
    items.push({ outline: marks.inscription, kind: 'inscription', depth: p.engravingDepth })
  }
  if (marks.number?.length && p.designNumber && side === 'right') {
    items.push({ outline: marks.number, kind: 'number', depth: NUMBER_DEPTH })
  }
  return items
}

/**
 * Place the marks for one temple along its straight part, one after the
 * other, centred in height. `zone` is the straight part along the temple.
 */
export function placeMarks(
  config: EyewearConfig,
  side: Side,
  marks: Marks,
  zone: { u0: number; u1: number },
): PlacedMark[] {
  const items = marksFor(config, side, marks)
  if (!items.length) return []
  const maxHeight = config.fit.templeWidth - 2 * EDGE_MARGIN
  const length = zone.u1 - zone.u0 - START_GAP
  // Shrink tall marks to the height, then all marks together to the length
  const sized = items.map((item) => {
    const b = bounds(item.outline)
    const k = b.height > maxHeight ? maxHeight / b.height : 1
    return { ...item, b, k }
  })
  const total = sized.reduce((sum, s) => sum + s.b.width * s.k, 0) + MARK_GAP * (sized.length - 1)
  const fit = total > length ? length / total : 1

  // Seen from between the temples, the right temple's inner face reads with
  // the temple's front end on the right, the left temple's with it on the
  // left; so the right temple's marks run backwards along X (mirrored).
  const mirror = side === 'right'
  let u = zone.u0 + START_GAP
  // Marks are placed in reading order: on the right temple, from the tip towards the hinge
  const ordered = mirror ? [...sized].reverse() : sized
  const placed = ordered.map((s) => {
    const k = s.k * fit
    const width = s.b.width * k
    const cx = (s.b.minX + s.b.maxX) / 2
    const cy = (s.b.minY + s.b.maxY) / 2
    const centreU = u + width / 2
    u += width + MARK_GAP * fit
    const outline = s.outline.map((loop) => {
      const moved = loop.map(([x, y]) => [centreU + (mirror ? -1 : 1) * (x - cx) * k, (y - cy) * k] as [number, number])
      // Mirroring flips the winding; even-odd filling doesn't mind, but keep loops consistent
      return mirror ? moved.reverse() : moved
    })
    return { outline, depth: s.depth, kind: s.kind, scaled: k < 0.999 }
  })
  return placed
}

/** The engraving cut of one mark as a 2D region (even-odd: holes in letters stay). Caller deletes it. */
export function markSection(wasm: ManifoldToplevel, mark: PlacedMark): CrossSection {
  return new wasm.CrossSection(mark.outline, 'EvenOdd')
}
