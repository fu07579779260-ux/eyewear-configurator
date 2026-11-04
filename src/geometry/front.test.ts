import Module, { type ManifoldToplevel } from 'manifold-3d'
import { beforeAll, describe, expect, it } from 'vitest'
import { FRAME_SHAPES } from '@/model/config'
import { sanitizeConfig } from '@/model/sanitize'
import { buildFrontFrame, GROOVE_DEPTH, GROOVE_WIDTH, lensCutOutline } from './front'
import { bounds, perimeter } from './lens'
import { fromManifold, toGeometry } from './manifold-mesh'

let wasm: ManifoldToplevel
beforeAll(async () => {
  wasm = await Module()
  wasm.setup()
})

describe('front frame', () => {
  it.each(FRAME_SHAPES)('is one watertight solid for %s', (frame) => {
    const { solid } = buildFrontFrame(wasm, sanitizeConfig({ shape: { frame } }))
    expect(solid.status()).toBe('NoError')
    expect(solid.isEmpty()).toBe(false)
    // Two lens openings through one connected body: a solid with two holes
    expect(solid.genus()).toBe(2)
    solid.delete()
  })

  it('spans the frame width, the rim height and the frame thickness', () => {
    for (const fit of [
      { frameWidth: 124, bridge: 14, lensHeight: 30, frontThickness: 4 },
      { frameWidth: 136, bridge: 18, lensHeight: 40, frontThickness: 5 },
      { frameWidth: 150, bridge: 24, lensHeight: 50, frontThickness: 7 },
    ]) {
      const config = sanitizeConfig({ fit })
      const { solid, layout } = buildFrontFrame(wasm, config)
      const box = solid.boundingBox()
      expect(box.max[0] - box.min[0]).toBeCloseTo(config.fit.frameWidth, 1)
      expect(box.min[1]).toBeCloseTo(layout.bottomY, 1)
      expect(box.max[2]).toBeCloseTo(0, 2)
      expect(box.min[2]).toBeCloseTo(-config.fit.frontThickness, 2)
      solid.delete()
    }
  })

  it('has a lens groove in each rim', () => {
    const config = sanitizeConfig({})
    const t = config.fit.frontThickness
    const { solid, layout } = buildFrontFrame(wasm, config)
    // Area of the lens openings in a slice through the frame at depth z
    const openingArea = (z: number) => {
      const slice = solid.slice(z)
      const holes = slice.toPolygons().map((p) => {
        let a = 0
        for (let i = 0; i < p.length; i++) a += p[i][0] * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * p[i][1]
        return Math.abs(a / 2)
      })
      slice.delete()
      holes.sort((a, b) => b - a)
      return holes[1] + holes[2] // the largest contour is the outside of the frame
    }
    const atGroove = openingArea(-t / 2)
    const beside = openingArea(-t / 2 + GROOVE_WIDTH / 2 + 0.5)
    solid.delete()
    // The groove widens each opening by its depth all the way round
    const expected = 2 * perimeter(layout.outline) * GROOVE_DEPTH
    expect(atGroove - beside).toBeGreaterThan(expected * 0.9)
    expect(atGroove - beside).toBeLessThan(expected * 1.15)
  })

  it('cuts the lens a little smaller than the groove, larger than the opening', () => {
    const config = sanitizeConfig({})
    const { solid, layout } = buildFrontFrame(wasm, config)
    solid.delete()
    const cut = bounds(lensCutOutline(layout))
    const opening = bounds(layout.outline)
    expect(cut.width).toBeGreaterThan(opening.width)
    expect(cut.width).toBeLessThan(opening.width + 2 * GROOVE_DEPTH)
  })

  it('turns into a preview mesh', () => {
    const { solid } = buildFrontFrame(wasm, sanitizeConfig({}))
    const geometry = toGeometry(fromManifold(solid))
    solid.delete()
    expect(geometry.getAttribute('position').count).toBeGreaterThan(1000)
    expect(geometry.getAttribute('normal')).toBeDefined()
    geometry.dispose()
  })
})
