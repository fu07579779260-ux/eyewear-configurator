import Module, { type Manifold, type ManifoldToplevel } from 'manifold-3d'
import { beforeAll, describe, expect, it } from 'vitest'
import { FRAME_SHAPES } from '@/model/config'
import { sanitizeConfig } from '@/model/sanitize'
import { buildFrontFrame } from './front'
import { HINGE, hingeLayout, TEMPLE_THICKNESS } from './hinge'
import { standInLayout } from './layout'
import { buildTemple, EAR_BEND } from './temple'

let wasm: ManifoldToplevel
beforeAll(async () => {
  wasm = await Module()
  wasm.setup()
})

/** Number of contours, and the areas of all but the largest, in a slice at height z. */
function slice(solid: Manifold, z: number) {
  const section = solid.slice(z)
  const areas = section
    .toPolygons()
    .map((p) => {
      let a = 0
      for (let i = 0; i < p.length; i++) a += p[i][0] * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * p[i][1]
      return Math.abs(a / 2)
    })
    .sort((a, b) => b - a)
  section.delete()
  return { count: areas.length, holes: areas.slice(1) }
}

describe('temple', () => {
  it.each([130, 145, 155])('is one watertight solid of the right size for a %i mm temple', (templeLength) => {
    const config = sanitizeConfig({ fit: { templeLength } })
    const temple = buildTemple(wasm, config)
    expect(temple.status()).toBe('NoError')
    expect(temple.genus()).toBe(0)
    expect(temple.decompose()).toHaveLength(1)
    const box = temple.boundingBox()
    // Straight part plus the ear bend seen from the side
    expect(box.max[0]).toBeGreaterThan(templeLength - EAR_BEND + EAR_BEND * 0.7)
    expect(box.max[0]).toBeLessThan(templeLength)
    expect(box.max[2] - box.min[2]).toBeCloseTo(TEMPLE_THICKNESS, 2)
    temple.delete()
  })

  it('has the hinge leaf pocket and pilot hole on its inner face only', () => {
    const temple = buildTemple(wasm, sanitizeConfig({}))
    const inPocket = slice(temple, 0.5)
    const pilotOnly = slice(temple, HINGE.leafThickness + 0.6)
    const outside = slice(temple, TEMPLE_THICKNESS - 0.5)
    temple.delete()
    // The pocket opening: leaf plus clearance all round
    const pocketArea = (HINGE.leafLength + 2 * HINGE.pocketClearance) * (HINGE.leafHeight + 2 * HINGE.pocketClearance)
    expect(inPocket.count).toBe(2)
    expect(inPocket.holes[0]).toBeCloseTo(pocketArea, 0)
    expect(pilotOnly.count).toBe(2)
    expect(pilotOnly.holes[0]).toBeCloseTo(Math.PI * (HINGE.pilotDiameter / 2) ** 2, 1)
    // The outer face is untouched
    expect(outside.count).toBe(1)
  })

  it('keeps a tall enough hinge zone on thin temples', () => {
    const temple = buildTemple(wasm, sanitizeConfig({ fit: { templeWidth: 4 } }))
    expect(temple.status()).toBe('NoError')
    expect(temple.genus()).toBe(0)
    temple.delete()
  })
})

describe('frame hinge pockets', () => {
  it.each(FRAME_SHAPES)('sit in the back of both end pieces of a %s frame', (frame) => {
    for (const fit of [{}, { frameWidth: 128, bridge: 24, rimWidth: 3, lensHeight: 30, frontThickness: 4 }]) {
      const config = sanitizeConfig({ shape: { frame }, fit })
      const { solid } = buildFrontFrame(wasm, config)
      const t = config.fit.frontThickness
      expect(solid.status()).toBe('NoError')
      // Still one body with two lens openings: the pockets are blind recesses
      expect(solid.genus()).toBe(2)
      // Near the back: outside, two lens openings and two pockets, each pocket separate from the openings
      expect(slice(solid, -t + 0.5).count).toBe(5)
      // The front face is untouched by the pockets
      expect(slice(solid, -0.3).count).toBe(3)
      solid.delete()
    }
  })
})

describe('hinge layout', () => {
  it('puts the temple flush with the frame end and lets it fold flat behind the frame', () => {
    for (const fit of [{}, { frontThickness: 4 }, { frontThickness: 7, frameWidth: 156 }]) {
      const config = sanitizeConfig({ fit })
      const h = hingeLayout(config)
      const l = standInLayout(config)
      expect(h.templeInnerX + TEMPLE_THICKNESS).toBeCloseTo(l.hingeX, 6)
      // The pivot is behind the frame and inside the temple's inner face
      expect(h.axisZ).toBeLessThan(-config.fit.frontThickness)
      expect(h.axisX).toBeLessThan(h.templeInnerX)
      // Folded 90° about the pivot, the temple's inner face comes to rest on the back of the frame
      const innerFaceAfterFold = h.axisZ + (h.templeInnerX - h.axisX)
      expect(innerFaceAfterFold).toBeCloseTo(-config.fit.frontThickness, 6)
      // The temple's front end clears the frame when open
      expect(h.templeFrontZ).toBeLessThan(-config.fit.frontThickness)
    }
  })
})
