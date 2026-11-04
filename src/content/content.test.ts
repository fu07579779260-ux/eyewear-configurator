import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GUIDE } from './guide'
import { INSPIRATION } from './inspiration'

describe('content pages', () => {
  it('has the same sections in English and Chinese', () => {
    expect(GUIDE.zh.map((s) => s.id)).toEqual(GUIDE.en.map((s) => s.id))
    GUIDE.en.forEach((s, i) => expect(GUIDE.zh[i].steps).toHaveLength(s.steps.length))
    expect(INSPIRATION.zh.concepts.map((c) => c.file)).toEqual(INSPIRATION.en.concepts.map((c) => c.file))
    expect(INSPIRATION.zh.cases).toHaveLength(INSPIRATION.en.cases.length)
  })

  it('points at concept images that exist', () => {
    for (const c of INSPIRATION.en.concepts) expect(existsSync(resolve(__dirname, '../../public/concept', c.file))).toBe(true)
  })

  it('puts the hinge and groove sizes into the guide', () => {
    const assembly = GUIDE.en.find((s) => s.id === 'assemble')!.steps.join(' ')
    expect(assembly).toContain('4.5 × 2.8 × 1 mm')
    expect(assembly).toContain('1.2 × 0.7 mm')
  })
})
