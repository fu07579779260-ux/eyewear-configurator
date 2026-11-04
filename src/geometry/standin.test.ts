import { Box3, Mesh } from 'three'
import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '@/model/config'
import { sanitizeConfig } from '@/model/sanitize'
import { buildStandIn, disposeStandIn, standInLayout } from './standin'

describe('stand-in glasses', () => {
  it('puts the hinges at half the frame width', () => {
    const l = standInLayout(DEFAULT_CONFIG)
    expect(l.hingeX * 2).toBeCloseTo(DEFAULT_CONFIG.fit.frameWidth, 6)
  })

  it('builds a rim as wide and tall as the lens plus the rim on each side', () => {
    const parts = buildStandIn(DEFAULT_CONFIG)
    const box = new Box3().setFromObject(new Mesh(parts.rim))
    const l = standInLayout(DEFAULT_CONFIG)
    const bevel = 0.6
    expect(box.max.x).toBeCloseTo(l.rimOuterX + bevel, 1)
    expect(box.max.y - box.min.y).toBeCloseTo(l.lensHeight + 2 * DEFAULT_CONFIG.fit.rimWidth + 2 * bevel, 1)
    disposeStandIn(parts)
  })

  it('makes the temple about as long as the temple length', () => {
    for (const templeLength of [130, 145, 155]) {
      const config = sanitizeConfig({ fit: { templeLength } })
      const parts = buildStandIn(config)
      const box = new Box3().setFromObject(new Mesh(parts.temple))
      // Straight part plus most of the ear bend, measured flat
      expect(box.max.x).toBeGreaterThan(templeLength - 12)
      expect(box.max.x).toBeLessThan(templeLength + 4)
      disposeStandIn(parts)
    }
  })

  it('builds every shape without empty geometry', () => {
    for (const frame of ['round', 'roundedSquare', 'catEye'] as const) {
      const parts = buildStandIn(sanitizeConfig({ shape: { frame } }))
      for (const g of Object.values(parts)) expect(g.getAttribute('position').count).toBeGreaterThan(0)
      disposeStandIn(parts)
    }
  })
})
