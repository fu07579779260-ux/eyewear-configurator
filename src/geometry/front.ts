import type { CrossSection, Manifold, ManifoldToplevel } from 'manifold-3d'
import type { EyewearConfig } from '@/model/config'
import { offsetOutline, type Outline } from './lens'
import { standInLayout, type StandInLayout } from './standin'

// The printed front frame (PLAN.md §9 step 6): both rims, the bridge and the
// two end pieces as ONE watertight solid, ready for SLS printing in PA12.
//
// It is built in 2D first (the frame seen from the front, as one cross
// section with two lens openings), then extruded to the frame thickness with
// rounded front and back edges, and finally the lens groove is cut into the
// inside of each rim. Coordinates as in standin.ts: millimetres, X across
// the face, Y up with Y = 0 at the lens centres, the frame between
// Z = -frontThickness (towards the face) and Z = 0 (the front).

/** The lens groove (PLAN.md §4.6): a slot in the rim that holds the lens edge. */
export const GROOVE_WIDTH = 1.2
export const GROOVE_DEPTH = 0.7
/** The lens is cut this much smaller than the groove bottom, so it can be snapped in. */
export const LENS_CLEARANCE = 0.1
/** Radius of the rounded front and back edges. */
export const EDGE_RADIUS = 0.8
/** Steps used to approximate the rounded edge (each well under an SLS layer pair). */
const EDGE_STEPS = 4

/** Keeps track of WASM objects so they can all be freed after building. */
class Scratch {
  private items: { delete(): void }[] = []
  keep<T extends { delete(): void }>(item: T): T {
    this.items.push(item)
    return item
  }
  free() {
    for (const item of this.items) item.delete()
    this.items = []
  }
}

const shift = (outline: Outline, dx: number) => outline.map(([x, y]) => [x + dx, y] as [number, number])

/** A flat band of constant width along a centre line, as a polygon (ends square). */
function band(points: [number, number][], halfWidth: number): [number, number][] {
  const normal = (i: number) => {
    const [ax, ay] = points[Math.max(0, i - 1)]
    const [bx, by] = points[Math.min(points.length - 1, i + 1)]
    const len = Math.hypot(bx - ax, by - ay) || 1
    return [-(by - ay) / len, (bx - ax) / len] as const
  }
  const left = points.map(([x, y], i) => [x + normal(i)[0] * halfWidth, y + normal(i)[1] * halfWidth] as [number, number])
  const right = points.map(([x, y], i) => [x - normal(i)[0] * halfWidth, y - normal(i)[1] * halfWidth] as [number, number])
  // Counter-clockwise: along the right side, back along the left
  return [...right, ...left.reverse()]
}

/** The arch of the bridge, from rim to rim, rising a little in the middle. */
export function bridgeCentreLine(config: EyewearConfig, l: StandInLayout): [number, number][] {
  const reach = config.fit.bridge / 2 + config.fit.rimWidth * 0.8
  return Array.from({ length: 17 }, (_, i) => {
    const t = i / 16
    return [-reach + 2 * reach * t, l.bridgeY + 3 * Math.sin(Math.PI * t)]
  })
}

/** The whole front seen from the front: rims, bridge and end pieces, with two lens openings. */
function frontSection(wasm: ManifoldToplevel, config: EyewearConfig, l: StandInLayout, s: Scratch): CrossSection {
  const { rimWidth } = config.fit
  const right = shift(offsetOutline(l.outline, rimWidth), l.lensCentreX)
  const endPiece = band(
    [
      [l.rimOuterX - rimWidth * 1.2, l.hingeY],
      [l.hingeX, l.hingeY],
    ],
    rimWidth * 0.6,
  )
  // Union of one side, mirrored for the other side, plus the bridge
  const side = s.keep(new wasm.CrossSection([right, endPiece], 'NonZero'))
  const both = s.keep(side.add(s.keep(side.mirror([1, 0]))))
  const bridge = s.keep(new wasm.CrossSection([band(bridgeCentreLine(config, l), rimWidth * 0.45)], 'NonZero'))
  const solid = s.keep(both.add(bridge))
  // Lens openings: the outline itself, on both sides
  const opening = s.keep(new wasm.CrossSection([shift(l.outline, l.lensCentreX)], 'NonZero'))
  const openings = s.keep(opening.add(s.keep(opening.mirror([1, 0]))))
  return s.keep(solid.subtract(openings))
}

/** Lens shape the optician cuts: the opening grown into the groove, less a little clearance. */
export function lensCutOutline(l: StandInLayout): Outline {
  return offsetOutline(l.outline, GROOVE_DEPTH - LENS_CLEARANCE)
}

export interface FrontFrame {
  /** The printable front; the caller deletes it */
  solid: Manifold
  layout: StandInLayout
}

/**
 * Build the printable front frame. The rounded edge is a stack of thin
 * layers, each inset a little more along a quarter circle, so the front and
 * back faces meet the sides without a sharp corner.
 */
export function buildFrontFrame(wasm: ManifoldToplevel, config: EyewearConfig): FrontFrame {
  const s = new Scratch()
  try {
    const l = standInLayout(config)
    const t = config.fit.frontThickness
    const r = Math.min(EDGE_RADIUS, t / 3)
    const section = frontSection(wasm, config, l, s)

    // Middle of the frame, full size
    let solid = s.keep(s.keep(section.extrude(t - 2 * r)).translate([0, 0, -t + r]))
    // Rounded edges: layers towards the front (z → 0) and the back (z → -t)
    const step = r / EDGE_STEPS
    // Each layer reaches a hair into the one below it: solids that only touch
    // along a flat face would stay separate pieces after the union
    const overlap = 0.02
    for (let k = 0; k < EDGE_STEPS; k++) {
      const z = (k + 0.5) * step // middle of this layer, measured from where the rounding starts
      const inset = r - Math.sqrt(r * r - z * z)
      const layer = s.keep(section.offset(-inset, 'Round'))
      const slab = s.keep(layer.extrude(step + overlap))
      const front = s.keep(slab.translate([0, 0, -r + k * step - overlap]))
      const back = s.keep(slab.translate([0, 0, -t + r - (k + 1) * step]))
      solid = s.keep(s.keep(solid.add(front)).add(back))
    }

    // Lens groove: a slot GROOVE_WIDTH wide in Z, GROOVE_DEPTH into each rim, in the middle of the frame
    const grooveRight = shift(offsetOutline(l.outline, GROOVE_DEPTH), l.lensCentreX)
    const groove2d = s.keep(new wasm.CrossSection([grooveRight], 'NonZero'))
    const groove2dBoth = s.keep(groove2d.add(s.keep(groove2d.mirror([1, 0]))))
    const groove = s.keep(s.keep(groove2dBoth.extrude(GROOVE_WIDTH)).translate([0, 0, -t / 2 - GROOVE_WIDTH / 2]))
    const result = solid.subtract(groove) // not kept: returned to the caller
    return { solid: result, layout: l }
  } finally {
    s.free()
  }
}
