import type { CrossSection, Manifold, ManifoldToplevel } from 'manifold-3d'
import type { EyewearConfig } from '@/model/config'
import { HINGE, hingeLayout } from './hinge'
import { offsetOutline, type Outline } from './lens'
import { band, roundedSlab, Scratch } from './solid'
import { standInLayout, type StandInLayout } from './layout'

// The printed front frame (PLAN.md §9 steps 6–7): both rims, the bridge and
// the two end pieces as ONE watertight solid, ready for SLS printing in PA12.
//
// It is built in 2D first (the frame seen from the front, as one cross
// section with two lens openings), then extruded to the frame thickness with
// rounded front and back edges. Then the lens groove is cut into the inside
// of each rim, and the hinge pockets into the back of each end piece.
// Coordinates as in standin.ts: millimetres, X across the face, Y up with
// Y = 0 at the lens centres, the frame between Z = -frontThickness (towards
// the face) and Z = 0 (the front).

/** The lens groove (PLAN.md §4.6): a slot in the rim that holds the lens edge. */
export const GROOVE_WIDTH = 1.2
export const GROOVE_DEPTH = 0.7
/** The lens is cut this much smaller than the groove bottom, so it can be snapped in. */
export const LENS_CLEARANCE = 0.1
/** Radius of the rounded front and back edges. */
export const EDGE_RADIUS = 0.8

const shift = (outline: Outline, dx: number) => outline.map(([x, y]) => [x + dx, y] as [number, number])

/** The arch of the bridge, from rim to rim, rising a little in the middle. */
export function bridgeCentreLine(config: EyewearConfig, l: StandInLayout): [number, number][] {
  const reach = config.fit.bridge / 2 + config.fit.rimWidth * 0.8
  return Array.from({ length: 17 }, (_, i) => {
    const t = i / 16
    return [-reach + 2 * reach * t, l.bridgeY + 3 * Math.sin(Math.PI * t)]
  })
}

/** Half the height of the end piece: room for the hinge leaf pocket plus a wall above and below. */
export const endPieceHalfHeight = (config: EyewearConfig) =>
  Math.max(config.fit.rimWidth * 0.6, HINGE.leafHeight / 2 + HINGE.pocketClearance + 1)

/** The whole front seen from the front: rims, bridge and end pieces, with two lens openings. */
function frontSection(wasm: ManifoldToplevel, config: EyewearConfig, l: StandInLayout, s: Scratch): CrossSection {
  const { rimWidth } = config.fit
  const right = shift(offsetOutline(l.outline, rimWidth), l.lensCentreX)
  const endPiece = band(
    [
      [l.rimOuterX - rimWidth * 1.2, l.hingeY],
      [l.hingeX, l.hingeY],
    ],
    endPieceHalfHeight(config),
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

/**
 * The frame hinge pocket on the right side: a recess for the leaf in the
 * back of the end piece, and a pilot hole for its screw.
 */
function framePocket(wasm: ManifoldToplevel, config: EyewearConfig, s: Scratch): Manifold {
  const t = config.fit.frontThickness
  const h = hingeLayout(config)
  const c = HINGE.pocketClearance
  const [x0, x1] = h.framePocketX
  const depth = HINGE.leafThickness + 0.1
  const recess = s.keep(
    s.keep(wasm.Manifold.cube([x1 - x0 + 2 * c, HINGE.leafHeight + 2 * c, depth + 0.01])).translate([
      x0 - c,
      h.y - HINGE.leafHeight / 2 - c,
      -t - 0.01,
    ]),
  )
  const pilot = s.keep(
    s.keep(wasm.Manifold.cylinder(depth + HINGE.pilotDepth, HINGE.pilotDiameter / 2, HINGE.pilotDiameter / 2, 24)).translate([
      (x0 + x1) / 2,
      h.y,
      -t - 0.01,
    ]),
  )
  return s.keep(recess.add(pilot))
}

export interface FrontFrame {
  /** The printable front; the caller deletes it */
  solid: Manifold
  layout: StandInLayout
}

/** Build the printable front frame. */
export function buildFrontFrame(wasm: ManifoldToplevel, config: EyewearConfig): FrontFrame {
  const s = new Scratch()
  try {
    const l = standInLayout(config)
    const t = config.fit.frontThickness
    const section = frontSection(wasm, config, l, s)
    const body = s.keep(roundedSlab(section, t, EDGE_RADIUS, s).translate([0, 0, -t]))

    // Lens groove: a slot GROOVE_WIDTH wide in Z, GROOVE_DEPTH into each rim, in the middle of the frame
    const grooveRight = shift(offsetOutline(l.outline, GROOVE_DEPTH), l.lensCentreX)
    const groove2d = s.keep(new wasm.CrossSection([grooveRight], 'NonZero'))
    const groove2dBoth = s.keep(groove2d.add(s.keep(groove2d.mirror([1, 0]))))
    const groove = s.keep(s.keep(groove2dBoth.extrude(GROOVE_WIDTH)).translate([0, 0, -t / 2 - GROOVE_WIDTH / 2]))

    // Hinge pockets on both sides
    const pocket = framePocket(wasm, config, s)
    const pockets = s.keep(pocket.add(s.keep(pocket.mirror([1, 0, 0]))))

    const cuts = s.keep(groove.add(pockets))
    const result = body.subtract(cuts) // not kept: returned to the caller
    return { solid: result, layout: l }
  } finally {
    s.free()
  }
}
