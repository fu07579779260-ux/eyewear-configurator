import { describe, expect, it } from 'vitest'
import { STRINGS } from '@/i18n/strings'
import type { EyewearConfig } from '@/model/config'
import { sanitizeConfig } from '@/model/sanitize'
import { printChecks, printWarnings, type CheckId } from './checks'

type Patch = { [S in keyof EyewearConfig]?: Partial<EyewearConfig[S]> }
const design = (patch: Patch) => sanitizeConfig(patch)
const warned = (patch: Patch) => printWarnings(design(patch)).map((c) => c.id)

describe('print checks', () => {
  it('pass for the default design', () => {
    expect(printWarnings(design({}))).toEqual([])
  })

  it('flag lens widths outside the usual range', () => {
    expect(warned({ fit: { frameWidth: 128, bridge: 24 } })).toContain('lensWidth')
    expect(warned({ fit: { frameWidth: 156, bridge: 14 } })).toContain('lensWidth')
  })

  it('flag grooves too fine to print', () => {
    expect(warned({ texture: { type: 'ribbed', ribPitch: 0.8 } })).toContain('ribs')
    expect(warned({ texture: { type: 'ribbed', ribPitch: 1.2 } })).not.toContain('ribs')
    // Smooth temples are not checked for grooves at all
    expect(printChecks(design({ texture: { ribPitch: 0.8 } })).map((c) => c.id)).not.toContain('ribs')
  })

  it('flag temples too low for pockets', () => {
    expect(warned({ texture: { type: 'perforated' }, fit: { templeWidth: 4 } })).toContain('pockets')
    expect(warned({ texture: { type: 'perforated' }, fit: { templeWidth: 6 } })).not.toContain('pockets')
  })

  it('flag letters too small to engrave', () => {
    expect(warned({ personal: { inscription: 'JL', textSize: 2 } })).toContain('textSize')
    expect(warned({ personal: { inscription: 'JL', textSize: 2.5 } })).not.toContain('textSize')
    // No inscription, nothing to check
    expect(warned({ personal: { inscription: '', textSize: 2 } })).not.toContain('textSize')
  })

  it('accept the longest parts on a small printer bed', () => {
    expect(warned({ fit: { frameWidth: 156, templeLength: 155 } })).not.toContain('bed')
  })

  it('have a message and a fix in both languages for every check', () => {
    const ids: CheckId[] = ['lensWidth', 'rimWall', 'frontWall', 'ribs', 'pockets', 'textSize', 'pocketSkin', 'bed']
    for (const lang of ['en', 'zh'] as const) {
      for (const id of ids) {
        for (const part of ['ok', 'warn', 'fix']) expect(Object.keys(STRINGS[lang])).toContain(`check.${id}.${part}`)
      }
    }
  })
})
