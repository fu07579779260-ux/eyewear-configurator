import type { Manifold, ManifoldToplevel } from 'manifold-3d'
import type { EyewearConfig } from '@/model/config'
import { HINGE, hingeLayout, TEMPLE_THICKNESS } from './hinge'
import { band, roundedSlab, Scratch } from './solid'
import { textureDepth, textureSection, textureZone } from './texture'

// The printed temple (PLAN.md §9 step 7), as a watertight solid in its own
// print frame: lying flat, length along +X from its front end (X = 0) to the
// tip, Y up with Y = 0 at the hinge height, thickness along +Z from the inner
// face (Z = 0, towards the head) to the outer face (Z = TEMPLE_THICKNESS).
// This is the RIGHT temple; the left one is its mirror image.
//
// From the side it runs straight back from the hinge, then bends down behind
// the ear and tapers towards the tip. The hinge leaf pocket and its screw
// pilot hole are on the inner face near the front end.

/** Length of the ear bend, measured back from the tip. */
export const EAR_BEND = 32
/** How far the tip drops below the hinge. */
export const EAR_DROP = 20
/** The tip is this share of the temple height. */
const TIP_SHARE = 0.62
/** Length at the front kept tall enough for the hinge pocket and smooth (PLAN.md §4.4). */
export const HINGE_ZONE = 15
/** Rounded edges of the temple. */
const EDGE_RADIUS = 0.8
const CORNER_RADIUS = 1.2

/** Centre line of the temple seen from the side, front end first. */
export function templeCentreLine(config: EyewearConfig): [number, number][] {
  const straight = config.fit.templeLength - EAR_BEND
  const points: [number, number][] = []
  for (let i = 0; i <= 24; i++) points.push([(straight * i) / 24, 0])
  for (let i = 1; i <= 16; i++) {
    const a = (i / 16) * (Math.PI / 2)
    points.push([straight + EAR_BEND * 0.8 * Math.sin(a), -EAR_DROP * (1 - Math.cos(a))])
  }
  return points
}

/** Height of the temple at each centre-line point: tall at the hinge, tapering behind the ear. */
export function templeHalfHeights(config: EyewearConfig, centre: [number, number][]): number[] {
  const half = config.fit.templeWidth / 2
  // The hinge zone must hold the leaf pocket with at least a 1 mm wall above and below
  const hingeHalf = Math.max(half, HINGE.leafHeight / 2 + HINGE.pocketClearance + 1)
  const straight = config.fit.templeLength - EAR_BEND
  let along = 0
  return centre.map(([x, y], i) => {
    if (i > 0) along += Math.hypot(x - centre[i - 1][0], y - centre[i - 1][1])
    if (along < HINGE_ZONE) return hingeHalf + (half - hingeHalf) * smooth(along / HINGE_ZONE)
    if (along < straight) return half
    const t = Math.min(1, (along - straight) / EAR_BEND)
    return half * (1 - (1 - TIP_SHARE) * smooth(t))
  })
}

const smooth = (t: number) => t * t * (3 - 2 * t)

/** Build the printable right temple. */
export function buildTemple(wasm: ManifoldToplevel, config: EyewearConfig): Manifold {
  const s = new Scratch()
  try {
    const centre = templeCentreLine(config)
    const heights = templeHalfHeights(config, centre)
    // Side profile with softly rounded corners
    const raw = s.keep(new wasm.CrossSection([band(centre, (i) => heights[i])], 'NonZero'))
    const profile = s.keep(s.keep(raw.offset(-CORNER_RADIUS, 'Round')).offset(CORNER_RADIUS, 'Round'))
    const body = roundedSlab(profile, TEMPLE_THICKNESS, EDGE_RADIUS, s)

    // Hinge leaf pocket and pilot hole on the inner face
    const h = hingeLayout(config)
    const c = HINGE.pocketClearance
    const [u0, u1] = h.templePocketU
    const depth = HINGE.leafThickness + 0.1
    const recess = s.keep(
      s.keep(wasm.Manifold.cube([u1 - u0 + 2 * c, HINGE.leafHeight + 2 * c, depth + 0.01])).translate([
        u0 - c,
        -HINGE.leafHeight / 2 - c,
        -0.01,
      ]),
    )
    const pilot = s.keep(
      s.keep(wasm.Manifold.cylinder(depth + HINGE.pilotDepth, HINGE.pilotDiameter / 2, HINGE.pilotDiameter / 2, 24)).translate([
        (u0 + u1) / 2,
        0,
        -0.01,
      ]),
    )
    let cuts = s.keep(recess.add(pilot))

    // Texture on the outer face, between the hinge zone and the ear bend (PLAN.md §4.4)
    const texture = textureSection(wasm, config, profile, textureZone(config, HINGE_ZONE, EAR_BEND))
    if (texture) {
      s.keep(texture)
      const depth = textureDepth(config)
      const slab = s.keep(s.keep(texture.extrude(depth + 0.05)).translate([0, 0, TEMPLE_THICKNESS - depth]))
      cuts = s.keep(cuts.add(slab))
    }
    return body.subtract(cuts) // not kept: returned to the caller
  } finally {
    s.free()
  }
}
