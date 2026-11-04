import type { CrossSection, ManifoldToplevel } from 'manifold-3d'
import type { EyewearConfig } from '@/model/config'
import { TEMPLE_THICKNESS } from './hinge'
import { Scratch } from './solid'

// Temple textures (PLAN.md §4.4, §9 step 10), cut into the OUTER face of the
// temple only. In the temple's print frame (see temple.ts) the outer face is
// at Z = TEMPLE_THICKNESS; the inner face (towards the head) stays smooth.
//
// The texture zone keeps clear of:
// - the hinge zone at the front (the leaf pocket and the hinge itself),
// - the ear bend at the back, which rests on the ear,
// - a margin along the top and bottom edges, so the rounded edges stay whole.
//
// Finely Ribbed: shallow straight grooves, across or along the temple.
// Organically Perforated: rounded, irregular pockets from a seeded cell
// pattern, deep but not through, so the side against the head stays closed
// and smooth. Sizes respect the SLS PA12 minimums (PLAN.md §5).

/** SLS PA12 minimums (PLAN.md §5). */
export const SLS = {
  minHole: 1.5,
  minStrut: 1.2,
  minWall: 0.8,
} as const

/** Keep this far from the top and bottom edges of the temple. */
export const EDGE_MARGIN = 1.0
/** Perforations stop this far short of the inner face (more than the SLS minimum wall). */
export const INNER_SKIN = 1.0
/** Rounding of the perforation corners, for the organic look. */
const HOLE_ROUNDING = 0.6

export interface TextureZone {
  /** Along the temple, from its front end */
  u0: number
  u1: number
}

/** Where the texture may go along the temple: after the hinge zone, before the ear bend. */
export function textureZone(config: EyewearConfig, hingeZone: number, earBend: number): TextureZone {
  return { u0: hingeZone, u1: config.fit.templeLength - earBend }
}

/**
 * How deep the cuts go into the outer face. Perforations stop INNER_SKIN short
 * of the inner face, and further still where that face is engraved, so the
 * wall between a pocket and an engraving never drops under the SLS minimum.
 */
export function textureDepth(config: EyewearConfig, engravedDepth = 0): number {
  return config.texture.type === 'ribbed' ? config.texture.ribDepth : TEMPLE_THICKNESS - INNER_SKIN - engravedDepth
}

/** Seeded random numbers, so the same seed always gives the same pattern. */
function mulberry32(seed: number) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type P = [number, number]

/** Clip a convex polygon to the half plane closer to `a` than to `b` (one Voronoi edge). */
function clipCloser(poly: P[], a: P, b: P): P[] {
  const mx = (a[0] + b[0]) / 2
  const my = (a[1] + b[1]) / 2
  const nx = b[0] - a[0]
  const ny = b[1] - a[1]
  const side = (p: P) => (p[0] - mx) * nx + (p[1] - my) * ny // < 0: on a's side
  const out: P[] = []
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    const sp = side(p)
    const sq = side(q)
    if (sp <= 0) out.push(p)
    if (sp * sq < 0) {
      const t = sp / (sp - sq)
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t])
    }
  }
  return out
}

/**
 * Seed points spread evenly but irregularly over a box (dart throwing with a
 * minimum spacing), so the cells come out similar in size but not in a grid.
 */
export function seedPoints(box: { x0: number; x1: number; y0: number; y1: number }, spacing: number, seed: number): P[] {
  const random = mulberry32(seed)
  const area = (box.x1 - box.x0) * (box.y1 - box.y0)
  const target = Math.ceil(area / (spacing * spacing * 0.75))
  const points: P[] = []
  const minGap = spacing * 0.78
  for (let tries = 0; tries < target * 40 && points.length < target; tries++) {
    const p: P = [box.x0 + random() * (box.x1 - box.x0), box.y0 + random() * (box.y1 - box.y0)]
    if (points.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) >= minGap)) points.push(p)
  }
  return points
}

/** Voronoi cells of the points inside the box, as convex polygons. */
export function voronoiCells(points: P[], box: { x0: number; x1: number; y0: number; y1: number }, reach: number): P[][] {
  return points.map((a) => {
    let cell: P[] = [
      [box.x0, box.y0],
      [box.x1, box.y0],
      [box.x1, box.y1],
      [box.x0, box.y1],
    ]
    for (const b of points) {
      if (b === a || Math.hypot(b[0] - a[0], b[1] - a[1]) > reach) continue
      cell = clipCloser(cell, a, b)
      if (cell.length < 3) break
    }
    return cell
  })
}

/** Spacing between perforation centres for a hole density of 0 – 1. */
export const perforationSpacing = (density: number) => 6.5 - 3 * density

/**
 * The texture as a 2D region in the temple's side view (X along the temple,
 * Y up), to be cut into the outer face to `textureDepth`. `profile` is the
 * temple's side outline; null for a smooth temple. The caller deletes the result.
 */
export function textureSection(
  wasm: ManifoldToplevel,
  config: EyewearConfig,
  profile: CrossSection,
  zone: TextureZone,
): CrossSection | null {
  const { texture } = config
  if (texture.type === 'smooth') return null
  const s = new Scratch()
  try {
    const half = config.fit.templeWidth / 2
    // Allowed area: inside the outline less the edge margin, between the hinge zone and the ear bend
    const inset = s.keep(profile.offset(-EDGE_MARGIN, 'Round'))
    const band = s.keep(
      new wasm.CrossSection(
        [
          [
            [zone.u0, -half - 5],
            [zone.u1, -half - 5],
            [zone.u1, half + 5],
            [zone.u0, half + 5],
          ],
        ],
        'NonZero',
      ),
    )
    const allowed = s.keep(inset.intersect(band))

    let pattern: CrossSection
    if (texture.type === 'ribbed') {
      // Grooves are a little under half the pitch wide, leaving a rib between each pair
      const groove = texture.ribPitch * 0.45
      const rects: P[][] = []
      if (texture.ribDirection === 'across') {
        for (let u = zone.u0 + texture.ribPitch / 2; u + groove <= zone.u1; u += texture.ribPitch) {
          rects.push([
            [u, -half - 1],
            [u + groove, -half - 1],
            [u + groove, half + 1],
            [u, half + 1],
          ])
        }
      } else {
        for (let y = -half + texture.ribPitch / 2; y + groove <= half; y += texture.ribPitch) {
          rects.push([
            [zone.u0, y],
            [zone.u1, y],
            [zone.u1, y + groove],
            [zone.u0, y + groove],
          ])
        }
      }
      pattern = s.keep(new wasm.CrossSection(rects, 'NonZero'))
    } else {
      const spacing = perforationSpacing(texture.holeDensity)
      const box = { x0: zone.u0, x1: zone.u1, y0: -half, y1: half }
      const points = seedPoints(box, spacing, texture.seed)
      const cells = voronoiCells(points, { x0: box.x0 - spacing, x1: box.x1 + spacing, y0: box.y0 - spacing, y1: box.y1 + spacing }, spacing * 3)
      // Shrink each cell on its own by half a strut, then round it off: organic holes with even
      // struts between them. (Joined first, neighbouring cells would merge into one region.)
      const holes = cells
        .filter((c) => c.length >= 3)
        .flatMap((c) => {
          const cell = s.keep(new wasm.CrossSection([c], 'NonZero'))
          const shrunk = s.keep(cell.offset(-(SLS.minStrut / 2 + HOLE_ROUNDING), 'Round'))
          return s.keep(shrunk.offset(HOLE_ROUNDING, 'Round')).toPolygons()
        })
      pattern = s.keep(new wasm.CrossSection(holes, 'NonZero'))
    }

    let cut = s.keep(pattern.intersect(allowed))
    if (texture.type === 'perforated') {
      // Holes too small to depowder are dropped (opening then closing removes anything under SLS.minHole)
      const open = s.keep(cut.offset(-SLS.minHole / 2, 'Round'))
      const kept = s.keep(open.offset(SLS.minHole / 2, 'Round'))
      cut = s.keep(kept.intersect(cut))
    }
    // Keep the result: copy it out of the scratch list
    return cut.translate([0, 0])
  } finally {
    s.free()
  }
}
