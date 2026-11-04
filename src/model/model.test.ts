import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, RANGES, SHAPE_LENS_HEIGHT, templeColour, type EyewearConfig } from './config'
import { designReducer } from './reducer'
import { clampToRange, sanitizeConfig } from './sanitize'
import {
  buildShareUrl,
  decodeShareParam,
  designCode,
  encodeShareParam,
  parseDesignFile,
  readShareParam,
  toDesignFile,
} from './serialize'
import { derivedSizes, parseSizeCode } from './sizes'

const fresh = (): EyewearConfig => structuredClone(DEFAULT_CONFIG)

describe('defaults', () => {
  it('are already valid', () => {
    expect(sanitizeConfig(DEFAULT_CONFIG)).toEqual(DEFAULT_CONFIG)
  })

  it('give a lens width close to 50 mm', () => {
    const { lensWidth, lensWidthOk, sizeCode } = derivedSizes(DEFAULT_CONFIG)
    expect(lensWidth).toBe(50.5)
    expect(lensWidthOk).toBe(true)
    expect(sizeCode).toBe('50.5□18-145')
  })
})

describe('sanitizeConfig', () => {
  it('falls back to the defaults for garbage', () => {
    expect(sanitizeConfig(null)).toEqual(DEFAULT_CONFIG)
    expect(sanitizeConfig('x')).toEqual(DEFAULT_CONFIG)
    expect(sanitizeConfig({ fit: [1, 2] })).toEqual(DEFAULT_CONFIG)
  })

  it('clamps and snaps numbers to their ranges', () => {
    const c = sanitizeConfig({ fit: { frameWidth: 999, bridge: 3, templeLength: 142 } })
    expect(c.fit.frameWidth).toBe(RANGES.fit.frameWidth.max)
    expect(c.fit.bridge).toBe(RANGES.fit.bridge.min)
    expect(c.fit.templeLength).toBe(140)
    expect(clampToRange(0.36, RANGES.texture.ribDepth)).toBe(0.35)
  })

  it('rejects unknown options and wrong types', () => {
    const c = sanitizeConfig({
      shape: { frame: 'hexagonal' },
      colour: { frame: 'gold', temple: 'navy' },
      personal: { designNumber: 'yes' },
      fit: { bridge: Number.NaN },
      extra: { anything: 1 },
    })
    expect(c.shape.frame).toBe('roundedSquare')
    expect(c.colour).toEqual({ frame: 'sand', temple: 'navy' })
    expect(c.personal.designNumber).toBe(true)
    expect(c.fit.bridge).toBe(18)
    expect('extra' in c).toBe(false)
  })

  it('cleans the inscription and limits it to 20 characters', () => {
    const c = sanitizeConfig({ personal: { inscription: 'A\u0007B  \n C' } })
    expect(c.personal.inscription).toBe('AB C')
    const long = sanitizeConfig({ personal: { inscription: '眼'.repeat(30) } })
    expect(Array.from(long.personal.inscription)).toHaveLength(20)
  })
})

describe('designReducer', () => {
  it('patches one section and keeps the others', () => {
    const next = designReducer(fresh(), { type: 'patch', section: 'colour', values: { frame: 'navy' } })
    expect(next.colour.frame).toBe('navy')
    expect(next.fit).toEqual(DEFAULT_CONFIG.fit)
  })

  it('gives a new shape its lens height', () => {
    const next = designReducer(fresh(), { type: 'patch', section: 'shape', values: { frame: 'round' } })
    expect(next.fit.lensHeight).toBe(SHAPE_LENS_HEIGHT.round)
  })

  it('keeps a hand-set lens height when other shape values change', () => {
    let c = designReducer(fresh(), { type: 'patch', section: 'fit', values: { lensHeight: 33 } })
    c = designReducer(c, { type: 'patch', section: 'shape', values: { cornerRadius: 10 } })
    expect(c.fit.lensHeight).toBe(33)
  })

  it('fills the fit from the size code of existing glasses', () => {
    const next = designReducer(fresh(), {
      type: 'fromGlasses',
      measurement: { lensWidth: 52, bridge: 18, templeLength: 145 },
    })
    expect(next.fit.frameWidth).toBe(145)
    expect(derivedSizes(next).sizeCode).toBe('52□18-145')
  })

  it('sets a new perforation seed and resets', () => {
    const next = designReducer(fresh(), { type: 'newPattern', seed: 42 })
    expect(next.texture.seed).toBe(42)
    expect(designReducer(next, { type: 'reset' })).toEqual(DEFAULT_CONFIG)
  })

  it('makes temples follow the frame colour by default', () => {
    const c = designReducer(fresh(), { type: 'patch', section: 'colour', values: { frame: 'burgundy' } })
    expect(templeColour(c)).toBe('burgundy')
    const own = designReducer(c, { type: 'patch', section: 'colour', values: { temple: 'sage' } })
    expect(templeColour(own)).toBe('sage')
  })
})

describe('parseSizeCode', () => {
  it.each(['52□18-145', '52-18-145', '52 18 145', '52/18/145', '52口18 145', '52[]18-145', ' 52 □ 18 – 145 '])(
    'reads %s',
    (input) => {
      expect(parseSizeCode(input)).toEqual({ ok: true, value: { lensWidth: 52, bridge: 18, templeLength: 145 } })
    },
  )

  it('reads decimals', () => {
    expect(parseSizeCode('49,5□20-140')).toEqual({ ok: true, value: { lensWidth: 49.5, bridge: 20, templeLength: 140 } })
  })

  it('rejects text it cannot read or sizes that are not glasses', () => {
    expect(parseSizeCode('hello')).toEqual({ ok: false, error: 'unreadable' })
    expect(parseSizeCode('52 18')).toEqual({ ok: false, error: 'unreadable' })
    expect(parseSizeCode('145-18-52')).toEqual({ ok: false, error: 'out-of-range' })
  })
})

describe('design file', () => {
  it('round-trips', () => {
    const c = designReducer(fresh(), { type: 'patch', section: 'personal', values: { inscription: '小明 · J.L.' } })
    expect(parseDesignFile(toDesignFile(c))).toEqual({ ok: true, config: c })
  })

  it('reports why a file cannot be opened', () => {
    expect(parseDesignFile('{')).toEqual({ ok: false, error: 'invalid-json' })
    expect(parseDesignFile('{"format":"perfume-configurator","config":{}}')).toEqual({ ok: false, error: 'not-a-design' })
    expect(parseDesignFile('{"format":"eyewear-configurator","version":99,"config":{}}')).toEqual({
      ok: false,
      error: 'newer-version',
    })
  })
})

describe('share link', () => {
  it('is empty for the default design', () => {
    expect(decodeShareParam(encodeShareParam(DEFAULT_CONFIG))).toEqual(DEFAULT_CONFIG)
    expect(encodeShareParam(DEFAULT_CONFIG)).toBe('e30') // "{}"
  })

  it('round-trips a full design, including Chinese text', () => {
    let c = fresh()
    c = designReducer(c, { type: 'patch', section: 'shape', values: { frame: 'catEye', wingLift: 7 } })
    c = designReducer(c, { type: 'patch', section: 'colour', values: { frame: 'navy', temple: 'sand' } })
    c = designReducer(c, { type: 'patch', section: 'texture', values: { type: 'perforated', holeDensity: 0.7 } })
    c = designReducer(c, { type: 'patch', section: 'personal', values: { inscription: '给妈妈 2026' } })
    const url = buildShareUrl(c, 'https://example.github.io/eyewear-configurator/#/configure')
    expect(url.startsWith('https://example.github.io/eyewear-configurator/#/configure?c=')).toBe(true)
    const param = readShareParam(url.slice(url.indexOf('#')))
    expect(param && decodeShareParam(param)).toEqual(c)
  })

  it('returns null for a broken parameter', () => {
    expect(decodeShareParam('%%%')).toBeNull()
    expect(readShareParam('#/configure')).toBeNull()
  })
})

describe('designCode', () => {
  it('is stable for the same design and changes with it', () => {
    expect(designCode(fresh())).toBe(designCode(fresh()))
    expect(designCode(fresh())).toMatch(/^EY-[0-9A-HJKMNP-TV-Z]{5}$/)
    const navy = designReducer(fresh(), { type: 'patch', section: 'colour', values: { frame: 'navy' } })
    expect(designCode(navy)).not.toBe(designCode(fresh()))
  })
})
