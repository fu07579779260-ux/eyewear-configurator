import Module, { type ManifoldToplevel } from 'manifold-3d'
import { beforeAll, describe, expect, it } from 'vitest'
import type { EyewearConfig } from '@/model/config'
import { sanitizeConfig } from '@/model/sanitize'
import { marksFor, placeMarks, type Marks } from './engrave'
import { TEMPLE_THICKNESS } from './hinge'
import { buildTemple, EAR_BEND, HINGE_ZONE } from './temple'
import { EDGE_MARGIN, textureZone } from './texture'
import type { Outline } from './trace'

let wasm: ManifoldToplevel
beforeAll(async () => {
  wasm = await Module()
  wasm.setup()
})

/** A stand-in for traced text: an "L" shape w × h mm (not symmetric, so mirroring shows). */
const letterL = (w: number, h: number): Outline => [
  [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [w / 2, -h / 2 + h * 0.3],
    [-w / 2 + w * 0.3, -h / 2 + h * 0.3],
    [-w / 2 + w * 0.3, h / 2],
    [-w / 2, h / 2],
  ],
]

const design = (personal: Partial<EyewearConfig['personal']>, fit: Partial<EyewearConfig['fit']> = {}) =>
  sanitizeConfig({ personal: { inscription: 'JL', ...personal }, fit })

const marks: Marks = { inscription: letterL(12, 2.5), number: letterL(14, 2) }
const zoneOf = (config: EyewearConfig) => textureZone(config, HINGE_ZONE, EAR_BEND)

function box(outline: Outline) {
  const xs = outline.flat().map((p) => p[0])
  const ys = outline.flat().map((p) => p[1])
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
}

describe('which marks go where', () => {
  it('puts the inscription on the chosen side and the design number on the right', () => {
    expect(marksFor(design({ placement: 'left' }), 'left', marks).map((m) => m.kind)).toEqual(['inscription'])
    expect(marksFor(design({ placement: 'left' }), 'right', marks).map((m) => m.kind)).toEqual(['number'])
    expect(marksFor(design({ placement: 'both' }), 'right', marks).map((m) => m.kind)).toEqual(['inscription', 'number'])
    expect(marksFor(design({ placement: 'both', designNumber: false }), 'left', marks).map((m) => m.kind)).toEqual(['inscription'])
    expect(marksFor(design({ inscription: '', designNumber: false }), 'right', marks)).toEqual([])
  })
})

describe('placeMarks', () => {
  it('lays the marks along the straight part, after the hinge zone, centred in height', () => {
    const config = design({ placement: 'both' })
    const placed = placeMarks(config, 'right', marks, zoneOf(config))
    expect(placed).toHaveLength(2)
    for (const m of placed) {
      const b = box(m.outline)
      expect(b.x0).toBeGreaterThanOrEqual(HINGE_ZONE)
      expect(b.x1).toBeLessThanOrEqual(config.fit.templeLength - EAR_BEND)
      expect((b.y0 + b.y1) / 2).toBeCloseTo(0, 6)
      expect(m.scaled).toBe(false)
    }
  })

  it('mirrors the right temple so both read the right way round from between the temples', () => {
    const config = design({ placement: 'both' })
    const [left] = placeMarks(config, 'left', marks, zoneOf(config))
    const right = placeMarks(config, 'right', marks, zoneOf(config)).find((m) => m.kind === 'inscription')!
    // The upright of the L sits at the reading start: the low-X end on the left temple,
    // the high-X end on the right one (its letters run backwards along X)
    const upright = (o: Outline) => {
      const b = box(o)
      const top = o[0].filter(([, y]) => y > b.y1 - 0.01).map(([x]) => x)
      return (Math.min(...top) + Math.max(...top)) / 2 < (b.x0 + b.x1) / 2 ? 'low' : 'high'
    }
    expect(upright(left.outline)).toBe('low')
    expect(upright(right.outline)).toBe('high')
  })

  it('shrinks marks that are too tall or too long for the temple', () => {
    const config = design({ placement: 'right' })
    const tall = placeMarks(config, 'right', { inscription: letterL(10, 8), number: null }, zoneOf(config))[0]
    const tb = box(tall.outline)
    expect(tall.scaled).toBe(true)
    expect(tb.y1 - tb.y0).toBeCloseTo(config.fit.templeWidth - 2 * EDGE_MARGIN, 6)
    const long = placeMarks(config, 'right', { inscription: letterL(300, 2), number: null }, zoneOf(config))[0]
    const lb = box(long.outline)
    expect(long.scaled).toBe(true)
    expect(lb.x1).toBeLessThanOrEqual(config.fit.templeLength - EAR_BEND + 1e-6)
  })
})

describe('engraved temple', () => {
  it('cuts the marks into the inner face only, as deep as set', () => {
    const config = design({ placement: 'right', engravingDepth: 0.5 })
    const solid = buildTemple(wasm, config, 'right', marks)
    expect(solid.status()).toBe('NoError')
    const count = (z: number) => {
      const slice = solid.slice(z)
      const n = slice.toPolygons().length
      slice.delete()
      return n
    }
    // Outline + hinge pocket + inscription + number near the inner face
    expect(count(0.2)).toBe(4)
    // Below the engraving only the hinge pocket remains
    expect(count(0.7)).toBe(2)
    // The outer face is untouched
    expect(count(TEMPLE_THICKNESS - 0.2)).toBe(1)
    solid.delete()
  })

  it('keeps a printable wall between perforations and the engraving', () => {
    const config = sanitizeConfig({
      personal: { inscription: 'JL', placement: 'both', engravingDepth: 0.6 },
      texture: { type: 'perforated', holeDensity: 1, seed: 5 },
    })
    const solid = buildTemple(wasm, config, 'left', marks)
    expect(solid.status()).toBe('NoError')
    // One body with no tunnels: no pocket breaks through into an engraved letter
    expect(solid.genus()).toBe(0)
    expect(solid.decompose()).toHaveLength(1)
    solid.delete()
  })
})
