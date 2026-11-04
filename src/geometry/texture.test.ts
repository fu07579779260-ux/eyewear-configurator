import Module, { type Manifold, type ManifoldToplevel } from 'manifold-3d'
import { beforeAll, describe, expect, it } from 'vitest'
import type { EyewearConfig } from '@/model/config'
import { sanitizeConfig } from '@/model/sanitize'
import { HINGE, TEMPLE_THICKNESS } from './hinge'
import { buildTemple, EAR_BEND, HINGE_ZONE } from './temple'
import { INNER_SKIN, seedPoints, SLS, voronoiCells } from './texture'

let wasm: ManifoldToplevel
beforeAll(async () => {
  wasm = await Module()
  wasm.setup()
})

const temple = (texture: Partial<EyewearConfig['texture']>, fit: Partial<EyewearConfig['fit']> = {}) =>
  sanitizeConfig({ texture, fit })

/** Holes in a slice of the temple at height z (all contours but the outline), with their boxes. */
function holesAt(solid: Manifold, z: number) {
  const section = solid.slice(z)
  const polys = section.toPolygons().map((p) => {
    let area = 0
    let x0 = Infinity
    let x1 = -Infinity
    let y0 = Infinity
    let y1 = -Infinity
    for (let i = 0; i < p.length; i++) {
      const [x, y] = p[i]
      const [nx, ny] = p[(i + 1) % p.length]
      area += x * ny - nx * y
      x0 = Math.min(x0, x)
      x1 = Math.max(x1, x)
      y0 = Math.min(y0, y)
      y1 = Math.max(y1, y)
    }
    return { area: Math.abs(area / 2), x0, x1, w: x1 - x0, h: y1 - y0 }
  })
  section.delete()
  polys.sort((a, b) => b.area - a.area)
  return polys.slice(1)
}

describe('smooth temple', () => {
  it('has no cuts on the outer face', () => {
    const solid = buildTemple(wasm, temple({ type: 'smooth' }))
    expect(holesAt(solid, TEMPLE_THICKNESS - 0.1)).toHaveLength(0)
    solid.delete()
  })
})

describe('finely ribbed temple', () => {
  it.each(['across', 'along'] as const)('has %s grooves only in the texture zone, as deep as set', (ribDirection) => {
    const config = temple({ type: 'ribbed', ribDirection, ribDepth: 0.4, ribPitch: 1.2 })
    const solid = buildTemple(wasm, config)
    expect(solid.status()).toBe('NoError')
    expect(solid.genus()).toBe(0)
    const grooves = holesAt(solid, TEMPLE_THICKNESS - 0.2)
    expect(grooves.length).toBeGreaterThan(ribDirection === 'across' ? 50 : 1)
    // Clear of the hinge zone at the front and the ear bend at the back
    for (const g of grooves) {
      expect(g.x0).toBeGreaterThanOrEqual(HINGE_ZONE - 0.01)
      expect(g.x1).toBeLessThanOrEqual(config.fit.templeLength - EAR_BEND + 0.01)
    }
    // No deeper than the rib depth
    expect(holesAt(solid, TEMPLE_THICKNESS - 0.5)).toHaveLength(0)
    solid.delete()
  })

  it('keeps the inner face smooth', () => {
    const solid = buildTemple(wasm, temple({ type: 'ribbed', ribDepth: 0.6 }))
    // Only the hinge pocket on the inside
    expect(holesAt(solid, 0.5)).toHaveLength(1)
    solid.delete()
  })
})

describe('organically perforated temple', () => {
  it.each([0, 0.5, 1])('makes printable pockets at density %s', (holeDensity) => {
    const config = temple({ type: 'perforated', holeDensity, seed: 7 })
    const solid = buildTemple(wasm, config)
    expect(solid.status()).toBe('NoError')
    // Blind pockets: still a solid without tunnels
    expect(solid.genus()).toBe(0)
    const holes = holesAt(solid, TEMPLE_THICKNESS - 0.3)
    expect(holes.length).toBeGreaterThan(2)
    for (const h of holes) {
      // Big enough to depowder, and inside the texture zone
      expect(Math.min(h.w, h.h)).toBeGreaterThanOrEqual(SLS.minHole - 0.05)
      expect(h.x0).toBeGreaterThanOrEqual(HINGE_ZONE - 0.01)
    }
    // The pockets stop short of the inner face, which stays smooth apart from the hinge pocket
    // (just under the pockets, only the hinge leaf pocket, which is deeper than the leaf, is cut)
    expect(holesAt(solid, INNER_SKIN - 0.1)).toHaveLength(1)
    expect(holesAt(solid, HINGE.leafThickness / 2)).toHaveLength(1)
    solid.delete()
  })

  it('makes more pockets at a higher density', () => {
    const count = (holeDensity: number) => {
      const solid = buildTemple(wasm, temple({ type: 'perforated', holeDensity, seed: 3 }, { templeWidth: 9 }))
      const n = holesAt(solid, TEMPLE_THICKNESS - 0.3).length
      solid.delete()
      return n
    }
    expect(count(1)).toBeGreaterThan(count(0))
  })

  it('gives the same pattern for the same seed and a new one for another seed', () => {
    const volume = (seed: number) => {
      const solid = buildTemple(wasm, temple({ type: 'perforated', seed }))
      const v = solid.volume()
      solid.delete()
      return v
    }
    expect(volume(11)).toBeCloseTo(volume(11), 6)
    expect(volume(11)).not.toBeCloseTo(volume(12), 1)
  })
})

describe('cell pattern', () => {
  it('spreads seed points with a minimum gap and fills the box with cells', () => {
    const box = { x0: 0, x1: 60, y0: 0, y1: 8 }
    const points = seedPoints(box, 4, 1)
    expect(points.length).toBeGreaterThan(10)
    for (const a of points) {
      for (const b of points) if (a !== b) expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeGreaterThanOrEqual(4 * 0.78 - 1e-9)
    }
    const cells = voronoiCells(points, box, 12)
    const area = cells.reduce((sum, c) => {
      let a = 0
      for (let i = 0; i < c.length; i++) a += c[i][0] * c[(i + 1) % c.length][1] - c[(i + 1) % c.length][0] * c[i][1]
      return sum + a / 2
    }, 0)
    expect(area).toBeCloseTo(60 * 8, 0)
  })
})
