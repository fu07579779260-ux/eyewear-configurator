import { describe, expect, it } from 'vitest'
import { FRAME_SHAPES, type FrameShape } from '@/model/config'
import {
  bounds,
  lensOutline,
  offsetOutline,
  OUTLINE_POINTS,
  perimeter,
  signedArea,
  topPoint,
  upperEdgeAt,
  type LensSpec,
  type Outline,
} from './lens'

const spec = (shape: FrameShape, extra: Partial<LensSpec> = {}): LensSpec => ({
  shape,
  width: 50,
  height: 40,
  cornerRadius: 8,
  wingLift: 5,
  ...extra,
})

/** True when two segments cross (sharing an end point does not count). */
function segmentsCross(a: readonly number[], b: readonly number[], c: readonly number[], d: readonly number[]) {
  const orient = (p: readonly number[], q: readonly number[], r: readonly number[]) =>
    Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]))
  return orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0
}

function selfCrossing(outline: Outline) {
  const n = outline.length
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue
      if (segmentsCross(outline[i], outline[(i + 1) % n], outline[j], outline[(j + 1) % n])) return true
    }
  }
  return false
}

describe('lensOutline', () => {
  it.each(FRAME_SHAPES)('%s fits the lens box exactly and runs counter-clockwise', (shape) => {
    for (const [width, height] of [
      [44, 30],
      [50, 40],
      [58, 50],
    ]) {
      const outline = lensOutline(spec(shape, { width, height }))
      const b = bounds(outline)
      expect(outline).toHaveLength(OUTLINE_POINTS)
      expect(b.width).toBeCloseTo(width, 6)
      expect(b.height).toBeCloseTo(height, 6)
      expect((b.minX + b.maxX) / 2).toBeCloseTo(0, 6)
      expect((b.minY + b.maxY) / 2).toBeCloseTo(0, 6)
      expect(signedArea(outline)).toBeGreaterThan(0)
    }
  })

  it.each(FRAME_SHAPES)('%s never crosses itself, across its own slider range', (shape) => {
    for (const cornerRadius of [3, 8, 15]) {
      for (const wingLift of [2, 5, 10]) {
        expect(selfCrossing(lensOutline(spec(shape, { cornerRadius, wingLift })))).toBe(false)
      }
    }
  })

  it('makes a round lens an ellipse', () => {
    const outline = lensOutline(spec('round'))
    for (const [x, y] of outline) expect((x / 25) ** 2 + (y / 20) ** 2).toBeCloseTo(1, 3)
  })

  it('gives a rounded square more area as its corners get sharper', () => {
    const soft = signedArea(lensOutline(spec('roundedSquare', { cornerRadius: 15 })))
    const sharp = signedArea(lensOutline(spec('roundedSquare', { cornerRadius: 3 })))
    expect(sharp).toBeGreaterThan(soft)
    // A 3 mm corner on a 50 × 40 box leaves almost the whole rectangle
    expect(sharp).toBeGreaterThan(50 * 40 * 0.98)
  })

  it('lifts the cat-eye wing on the outer, upper corner', () => {
    const outline = lensOutline(spec('catEye', { wingLift: 8 }))
    const [x, y] = topPoint(outline)
    expect(x).toBeGreaterThan(10) // towards the temple
    expect(y).toBeCloseTo(20, 6) // the top of the box
    // The brow on the nose side sits lower than the wing
    expect(upperEdgeAt(outline, -15)).toBeLessThan(y - 3)
  })

  it('raises the wing more with a bigger wing lift', () => {
    const drop = (wingLift: number) => {
      const outline = lensOutline(spec('catEye', { wingLift }))
      return topPoint(outline)[1] - upperEdgeAt(outline, -15)
    }
    expect(drop(10)).toBeGreaterThan(drop(2))
  })
})

describe('offsetOutline', () => {
  it.each(FRAME_SHAPES)('grows %s by the rim width on every side', (shape) => {
    const outline = lensOutline(spec(shape))
    const grown = bounds(offsetOutline(outline, 4.5))
    expect(grown.width).toBeCloseTo(50 + 9, 0)
    expect(grown.height).toBeCloseTo(40 + 9, 0)
    expect(perimeter(offsetOutline(outline, 4.5))).toBeGreaterThan(perimeter(outline))
    expect(selfCrossing(offsetOutline(outline, 4.5))).toBe(false)
  })
})
